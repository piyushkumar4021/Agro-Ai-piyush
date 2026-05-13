const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

const registerValidation = [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['farmer', 'buyer']),
];

router.post('/register', registerValidation, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
