const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { isUserOnline } = require('../socket/socketHandler');
const { markMessagesSeen, getUnreadCounts } = require('../services/messageStatusService');

// @desc    Get all messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversationId, deletedFor: { $ne: req.user._id } })
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Send text message via REST API
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, text } = req.body;

    if (!conversationId || !receiverId || !text) {
      return res.status(400).json({ message: 'conversationId, receiverId, and text are required' });
    }

    const receiverOnline = isUserOnline(receiverId);
    const status = receiverOnline ? 'delivered' : 'sent';
    const deliveredAt = receiverOnline ? new Date() : null;

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text,
      messageType: 'text',
      status,
      deliveredAt,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).to(receiverId).emit('message:receive', fullMessage);
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload media (image or video) and create message
// @route   POST /api/messages/upload
// @access  Private
const uploadMediaMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, text } = req.body;

    if (!conversationId || !receiverId) {
      return res.status(400).json({ message: 'conversationId and receiverId are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No media file provided' });
    }

    const mediaUrl = await uploadToCloudinary(req.file, 'chat-app/media');
    const isVideo = req.file.mimetype.startsWith('video');
    const messageType = isVideo ? 'video' : 'image';

    const receiverOnline = isUserOnline(receiverId);
    const status = receiverOnline ? 'delivered' : 'sent';
    const deliveredAt = receiverOnline ? new Date() : null;

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text: text || '',
      messageType,
      mediaUrl,
      status,
      deliveredAt,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).to(receiverId).emit('message:receive', fullMessage);
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation messages as seen
// @route   PATCH /api/messages/:conversationId/seen
// @access  Private
const markConversationSeen = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const result = await markMessagesSeen(conversationId, userId);

    if (result.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId.toString()).emit('messages:seen', {
          conversationId: conversationId.toString(),
          readerId: userId.toString(),
          messageIds: result.messageIds.map((id) => id.toString()),
          seenAt: result.seenAt,
        });
      }
    }

    res.json({
      message: 'Messages marked as seen',
      modifiedCount: result.modifiedCount,
      messageIds: result.messageIds,
      seenAt: result.seenAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread counts for current user
// @route   GET /api/messages/unread/counts
// @access  Private
const getUserUnreadCounts = async (req, res, next) => {
  try {
    const counts = await getUnreadCounts(req.user._id);
    res.json(counts);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message for me or for everyone
// @route   DELETE /api/messages/:id?scope=me|everyone
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = req.query.scope === 'me' ? 'me' : 'everyone';
    const userId = req.user._id.toString();

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const isSender = message.sender.toString() === userId;
    const isReceiver = message.receiver.toString() === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    const conversationId = message.conversationId.toString();
    const io = req.app.get('io');

    if (scope === 'me') {
      await Message.updateOne({ _id: id }, { $addToSet: { deletedFor: req.user._id } });

      // Only remove it from this user's own sessions
      if (io) {
        io.to(userId).emit('message:delete', { messageId: id, conversationId });
      }

      return res.json({ scope, messageId: id, conversationId });
    }

    // Only the sender can delete for everyone
    if (!isSender) {
      return res.status(403).json({ message: 'Only the sender can delete this message for everyone' });
    }

    message.isDeletedForEveryone = true;
    message.text = '';
    message.mediaUrl = '';
    message.isEdited = false;
    await message.save();

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    // Broadcast so both participants see the "This message was deleted" placeholder
    if (io) {
      io.to(conversationId).to(message.receiver.toString()).to(userId).emit('message:update', fullMessage);
    }

    res.json({ scope, messageId: id, conversationId, message: fullMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit/update a message text by ID
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender of the message to edit it
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({ message: 'Deleted messages cannot be edited' });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    // Broadcast real-time message update event
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).to(message.receiver.toString()).emit('message:update', fullMessage);
    }

    res.json(fullMessage);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  uploadMediaMessage,
  markConversationSeen,
  getUserUnreadCounts,
  deleteMessage,
  updateMessage,
};

