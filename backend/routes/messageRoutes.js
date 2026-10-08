const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  uploadMediaMessage,
  markConversationSeen,
  getUserUnreadCounts,
  deleteMessage,
  updateMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/unread/counts', protect, getUserUnreadCounts);
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadMediaMessage);
router.patch('/:conversationId/seen', protect, markConversationSeen);
router.put('/:id', protect, updateMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
