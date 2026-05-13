const Crop = require('../models/Crop.model');

// @route GET /api/crops  — public, with filters
exports.getAllCrops = async (req, res) => {
  try {
    const { category, status, state, district, search, page = 1, limit = 12 } = req.query;
    const query = { status: 'available' };

    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const total = await Crop.countDocuments(query);
    const crops = await Crop.find(query)
      .populate('farmer', 'name phone address profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/crops/:id
exports.getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmer', 'name phone address');
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    crop.views += 1;
    await crop.save({ validateBeforeSave: false });

    res.json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/crops  — farmer only
exports.createCrop = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => f.path) : [];
    const crop = await Crop.create({
      ...req.body,
      farmer: req.user._id,
      images,
    });
    res.status(201).json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/crops/:id  — farmer (own crop) or admin
exports.updateCrop = async (req, res) => {
  try {
    let crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const isOwner = crop.farmer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    crop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/crops/:id
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const isOwner = crop.farmer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await crop.deleteOne();
    res.json({ success: true, message: 'Crop removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/crops/my/listings  — farmer's own crops
exports.getMyCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
