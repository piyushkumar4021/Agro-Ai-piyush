const User = require('../models/User.model');

// @route GET /api/users/profile
exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'farmDetails', 'businessDetails', 'paymentDetails'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.file) updates.profileImage = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/users/:id  — public profile
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name role profileImage address farmDetails businessDetails createdAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
