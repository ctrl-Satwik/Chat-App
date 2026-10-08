const express = require('express');
const router = express.Router();
const {
  accessConversation,
  getConversations,
  getConversationById,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, accessConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);

module.exports = router;
