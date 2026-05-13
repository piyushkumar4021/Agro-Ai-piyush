const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// @route  POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    name,
    email,
    password,
    role,
    phone,
    address,
    farmDetails,
    businessDetails,
    paymentDetails,
  } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address,
      farmDetails,
      businessDetails,
      paymentDetails,
    });

    const token = signToken(user._id);
    user.password = undefined;

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    if (!user.isActive)
      return res
        .status(403)
        .json({ success: false, message: "Account is deactivated" });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    user.password = undefined;

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route  PUT /api/auth/update-password
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    const token = signToken(user._id);
    res.json({ success: true, token, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
