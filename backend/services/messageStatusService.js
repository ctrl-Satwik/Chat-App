const mongoose = require('mongoose');
const Message = require('../models/Message');

/**
 * Marks pending 'sent' messages as 'delivered' when a receiver connects
 * @param {string|ObjectId} receiverId 
 * @returns {Promise<Array>} List of updated messages
 */
const markPendingMessagesDeliveredForUser = async (receiverId) => {
  try {
    const pendingMessages = await Message.find({
      receiver: receiverId,
      status: 'sent',
    });

    if (!pendingMessages.length) return [];

    const messageIds = pendingMessages.map((m) => m._id);
    const now = new Date();

    await Message.updateMany(
      { _id: { $in: messageIds }, status: 'sent' },
      { $set: { status: 'delivered', deliveredAt: now } }
    );

    // Return populated updated messages
    const updatedMessages = await Message.find({ _id: { $in: messageIds } })
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    return updatedMessages;
  } catch (error) {
    console.error('Error in markPendingMessagesDeliveredForUser:', error);
    return [];
  }
};

/**
 * Marks a single message as delivered
 * @param {string|ObjectId} messageId 
 * @param {string|ObjectId} receiverId 
 * @returns {Promise<Object|null>}
 */
const markMessageDelivered = async (messageId, receiverId) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, receiver: receiverId, status: 'sent' },
      { $set: { status: 'delivered', deliveredAt: new Date() } },
      { new: true }
    )
      .populate('sender', 'fullName email profilePhoto')
      .populate('receiver', 'fullName email profilePhoto');

    return message;
  } catch (error) {
    console.error('Error in markMessageDelivered:', error);
    return null;
  }
};

/**
 * Marks all unread messages in a conversation as seen for a specific receiver
 * @param {string|ObjectId} conversationId 
 * @param {string|ObjectId} receiverId 
 * @returns {Promise<{ modifiedCount: number, messageIds: Array }>}
 */
const markMessagesSeen = async (conversationId, receiverId) => {
  try {
    const unreadMessages = await Message.find({
      conversationId,
      receiver: receiverId,
      status: { $ne: 'seen' },
    });

    if (!unreadMessages.length) {
      return { modifiedCount: 0, messageIds: [] };
    }

    const messageIds = unreadMessages.map((m) => m._id);
    const now = new Date();

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: 'seen', seenAt: now } }
    );

    return {
      modifiedCount: result.modifiedCount || messageIds.length,
      messageIds,
      seenAt: now,
    };
  } catch (error) {
    console.error('Error in markMessagesSeen:', error);
    return { modifiedCount: 0, messageIds: [] };
  }
};

/**
 * Gets unread message counts per conversation for a user
 * @param {string|ObjectId} userId 
 * @returns {Promise<Object>} Map of conversationId -> count
 */
const getUnreadCounts = async (userId) => {
  try {
    const receiverId = new mongoose.Types.ObjectId(userId.toString());
    const counts = await Message.aggregate([
      {
        $match: {
          receiver: receiverId,
          status: { $ne: 'seen' },
          deletedFor: { $ne: receiverId },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = {};
    counts.forEach((item) => {
      unreadMap[item._id.toString()] = item.count;
    });

    return unreadMap;
  } catch (error) {
    console.error('Error in getUnreadCounts:', error);
    return {};
  }
};

module.exports = {
  markPendingMessagesDeliveredForUser,
  markMessageDelivered,
  markMessagesSeen,
  getUnreadCounts,
};
