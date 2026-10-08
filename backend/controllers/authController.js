const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields: fullName, email, password' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    let profilePhotoUrl = '';
    if (req.file) {
      try {
        profilePhotoUrl = await uploadToCloudinary(req.file, 'chat-app/avatars');
      } catch (uploadErr) {
        console.error('Error uploading profile photo:', uploadErr.message);
      }
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      profilePhoto: profilePhotoUrl,
      isOnline: true,
      lastSeen: new Date(),
    });

    if (user) {
      const token = generateToken(user._id);
      return res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        token,
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      user.isOnline = true;
      await user.save();

      const token = generateToken(user._id);
      return res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        token,
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
