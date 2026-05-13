const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserById } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/profiles/' });

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.get('/:id', getUserById);

module.exports = router;
