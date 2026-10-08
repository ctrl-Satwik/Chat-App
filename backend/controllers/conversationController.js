const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');

// Swap lastMessage for the latest one still visible to the user when they
// have used "Delete for me" on the conversation's last message
const withVisibleLastMessage = async (conversation, userId) => {
  const last = conversation.lastMessage;
  const hiddenForUser = last?.deletedFor?.some((u) => u.toString() === userId.toString());
  if (!hiddenForUser) return conversation;

  const visibleLast = await Message.findOne({
    conversationId: conversation._id,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate('sender receiver', 'fullName email profilePhoto');

  const obj = conversation.toObject();
  obj.lastMessage = visibleLast;
  return obj;
};

// @desc    Create or access 1-on-1 conversation
// @route   POST /api/conversations
// @access  Private
const accessConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists between the two users
    let isConversation = await Conversation.find({
      participants: { $all: [req.user._id, receiverId] },
    })
      .populate('participants', '-password')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender receiver',
          select: 'fullName email profilePhoto',
        },
      });

    if (isConversation.length > 0) {
      return res.json(await withVisibleLastMessage(isConversation[0], req.user._id));
    } else {
      // Create new conversation
      const newConversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        lastMessageAt: new Date(),
      });

      const fullConversation = await Conversation.findById(newConversation._id).populate(
        'participants',
        '-password'
      );
      return res.status(201).json(fullConversation);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for logged in user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', '-password')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender receiver',
          select: 'fullName email profilePhoto',
        },
      })
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      conversations.map((conv) => withVisibleLastMessage(conv, req.user._id))
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', '-password')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender receiver',
          select: 'fullName email profilePhoto',
        },
      });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Ensure logged in user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    res.json(await withVisibleLastMessage(conversation, req.user._id));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessConversation,
  getConversations,
  getConversationById,
};
