const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  image_order: { type: Number, default: 0 },
  is_primary: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, { _id: true });

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  gender: { type: String, required: true },
  model: { type: String, default: '' },
  description: { type: String, default: '' },
  image_url: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  images: [productImageSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { _id: true });

// Indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ gender: 1 });

module.exports = mongoose.model('Product', productSchema);

