const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('profilePhoto'), registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
