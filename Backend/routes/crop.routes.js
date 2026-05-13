const express = require('express');
const router = express.Router();
const {
  getAllCrops, getCropById, createCrop,
  updateCrop, deleteCrop, getMyCrops,
} = require('../controllers/crop.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/crops/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', getAllCrops);
router.get('/my/listings', protect, authorize('farmer'), getMyCrops);
router.get('/:id', getCropById);
router.post('/', protect, authorize('farmer'), upload.array('images', 5), createCrop);
router.put('/:id', protect, authorize('farmer', 'admin'), updateCrop);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteCrop);

module.exports = router;
