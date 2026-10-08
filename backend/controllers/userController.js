const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Get all users except logged in user
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by name or email
// @route   GET /api/users/search?query=
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
      return res.json(users);
    }

    const keyword = {
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { fullName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    };

    const users = await User.find(keyword).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile photo or name
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.fullName) {
      user.fullName = req.body.fullName;
    }

    if (req.file) {
      const profilePhotoUrl = await uploadToCloudinary(req.file, 'chat-app/avatars');
      user.profilePhoto = profilePhotoUrl;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePhoto: updatedUser.profilePhoto,
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  updateUserProfile,
};
