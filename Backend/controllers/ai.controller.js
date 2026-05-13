const axios = require('axios');
const PricePrediction = require('../models/PricePrediction.model');
const Crop = require('../models/Crop.model');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @route POST /api/ai/predict-price
// Called by farmer when listing a crop to get AI-suggested price
exports.predictPrice = async (req, res) => {
  try {
    const { cropName, category, season, district, state, qualityGrade, marketDemand } = req.body;

    let predictedPrice, confidence, modelVersion = 'v1';

    try {
      // Forward to Python/Flask AI microservice
      const aiResponse = await axios.post(`${AI_URL}/predict-price`, {
        crop_name: cropName,
        category,
        season,
        district,
        state,
        quality_grade: qualityGrade,
        market_demand: marketDemand,
      });
      predictedPrice = aiResponse.data.predicted_price;
      confidence = aiResponse.data.confidence;
      modelVersion = aiResponse.data.model_version || 'v1';
    } catch (aiErr) {
      // Fallback: simple rule-based pricing if AI service is down
      console.warn('AI service unavailable, using fallback pricing');
      const basePrices = {
        vegetables: 25, fruits: 40, grains: 20, pulses: 60, spices: 150, others: 30,
      };
      const gradeMultiplier = { A: 1.2, B: 1.0, C: 0.8 };
      predictedPrice =
        (basePrices[category] || 30) * (gradeMultiplier[qualityGrade] || 1.0);
      confidence = 50;
      modelVersion = 'fallback';
    }

    // Save to history
    const prediction = await PricePrediction.create({
      cropName,
      category,
      inputFeatures: { season, district, state, qualityGrade, marketDemand },
      predictedPrice,
      confidence,
      requestedBy: req.user._id,
      modelVersion,
    });

    res.json({ success: true, predictedPrice, confidence, modelVersion, predictionId: prediction._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/ai/recommendations  — buyer gets personalized crop recommendations
exports.getCropRecommendations = async (req, res) => {
  try {
    const { category, state, budget } = req.query;

    const query = { isApproved: true, status: 'available' };
    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (budget) query.pricePerUnit = { $lte: Number(budget) };

    // Simple scoring: prefer higher quality + lower price
    const crops = await Crop.find(query)
      .populate('farmer', 'name')
      .sort({ qualityGrade: 1, pricePerUnit: 1 })
      .limit(10);

    res.json({ success: true, recommendations: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/ai/price-history  — price prediction history for a crop
exports.getPriceHistory = async (req, res) => {
  try {
    const { cropName, limit = 30 } = req.query;
    const query = cropName ? { cropName } : {};
    const history = await PricePrediction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/ai/model-stats  — admin
exports.getModelStats = async (req, res) => {
  try {
    const totalPredictions = await PricePrediction.countDocuments();
    const avgConfidence = await PricePrediction.aggregate([
      { $group: { _id: null, avg: { $avg: '$confidence' } } },
    ]);
    const byVersion = await PricePrediction.aggregate([
      { $group: { _id: '$modelVersion', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, totalPredictions, avgConfidence: avgConfidence[0]?.avg, byVersion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
