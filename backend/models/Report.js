const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  confidence: { type: Number },
  keywords: [{ type: String }],
  rating: { type: Number },
  review: { type: String },
  sentiment: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL']},
  user: { type: String }
});

const sentimentDistributionSchema = new mongoose.Schema({
  negative: { type: Number },
  neutral: { type: Number },
  positive: { type: Number }
});

const analysisReportSchema = new mongoose.Schema({
  uid: { type: String},
  title: { type: String },
  description: { type: String },
  icon: { type: String },
  keywords: [{ type: String }],
  sentiment_distribution: sentimentDistributionSchema,
  analyzed_reviews: [reviewSchema],
  suggestions: [{ type: String }],
  success: { type: Boolean }
},
{
  timestamps: true   // ← adds createdAt & updatedAt
});

module.exports = mongoose.model('AnalysisReport', analysisReportSchema);