const express = require('express');
const router = express.Router();
const { getUsers, searchUsers, getUserById, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getUsers);
router.get('/search', protect, searchUsers);
router.put('/profile', protect, upload.single('profilePhoto'), updateUserProfile);
router.get('/:id', protect, getUserById);

module.exports = router;
