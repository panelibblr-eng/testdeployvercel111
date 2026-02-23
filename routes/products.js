const express = require('express');
const router = express.Router();
const { ensureDatabaseConnection } = require('../database/init');
const Product = require('../database/models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer to use memory storage (not disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to upload buffer to Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'monica-opto-hub/products',
        public_id: filename,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// Helper function to delete image from Cloudinary
async function deleteFromCloudinary(imageUrl) {
  try {
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      // Extract public_id from URL
      const urlParts = imageUrl.split('/');
      const publicIdWithExt = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy('monica-opto-hub/products/' + publicId.split('/').pop());
    }
  } catch (err) {
    console.error('Error deleting from Cloudinary:', err);
  }
}

// GET /api/products - Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      console.log('⚠️ Database not available, returning empty products array');
      return res.json({ success: true, products: [], count: 0, message: 'Database not available. Frontend will use localStorage.' });
    }
    const { category, gender, featured, search, brand, limit, offset } = req.query;
    
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (gender && gender !== 'all') {
      query.gender = gender;
    }
    
    if (brand && brand !== 'all') {
      query.brand = brand;
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      sort: { created_at: -1 }
    };
    
    if (limit) {
      options.limit = parseInt(limit);
      if (offset) {
        options.skip = parseInt(offset);
      }
    }
    
    const products = await Product.find(query, null, options);
    
    const productsWithImages = products.map(product => {
      const productObj = product.toObject();
      productObj.images = (productObj.images || []).sort((a, b) => a.image_order - b.image_order);
      return productObj;
    });
    
    res.json({ success: true, products: productsWithImages, count: productsWithImages.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/products/brands - Get all unique brands
router.get('/brands', async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      console.log('⚠️ Database not available, returning empty brands array');
      return res.json({ success: true, brands: [] });
    }
    const brands = await Product.distinct('brand', { brand: { $ne: null } }).sort();
    res.json({ success: true, brands });
  } catch (error) {
    console.error('Error in GET /api/products/brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/stats/summary - Get product statistics
router.get('/stats/summary', async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      console.log('⚠️ Database not available, returning empty stats');
      return res.json({ success: true, total: 0, featured: 0, byCategory: {}, byGender: {} });
    }
    
    const [
      totalProducts,
      featuredProducts,
      productsByCategory,
      productsByBrand,
      averagePriceResult,
      priceRangeResult
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ featured: true }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]),
      Product.aggregate([
        { $match: { brand: { $ne: null } } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { brand: '$_id', count: 1, _id: 0 } }
      ]),
      Product.aggregate([
        { $group: { _id: null, average: { $avg: '$price' } } }
      ]),
      Product.aggregate([
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ])
    ]);
    
    res.json({
      success: true,
      totalProducts,
      featuredProducts,
      productsByCategory,
      productsByBrand,
      averagePrice: averagePriceResult[0]?.average || 0,
      priceRange: {
        min: priceRangeResult[0]?.min || 0,
        max: priceRangeResult[0]?.max || 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/products/stats/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      console.log('⚠️ Database not available');
      return res.status(404).json({ success: false, error: 'Product not found. Database not available.' });
    }
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productObj = product.toObject();
    productObj.images = (productObj.images || []).sort((a, b) => a.image_order - b.image_order);
    
    res.json(productObj);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    await ensureDatabaseConnection();
    
    console.log('Product creation request received');
    console.log('Files uploaded:', req.files ? req.files.length : 0);
    
    const {
      name,
      brand,
      price,
      category,
      gender,
      model,
      description,
      featured,
      trending
    } = req.body;
    
    if (!name || !brand || !price || !category || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Upload images to Cloudinary
    let images = [];
    let primaryImageUrl = '';
    
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filename = 'product-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
        const result = await uploadToCloudinary(file.buffer, filename);
        
        if (i === 0) primaryImageUrl = result.secure_url;
        
        images.push({
          image_url: result.secure_url,
          image_order: i,
          is_primary: i === 0
        });
      }
    }
    
    const product = new Product({
      _id: id,
      name,
      brand,
      price: parseFloat(price),
      category,
      gender,
      model: model || '',
      description: description || '',
      image_url: primaryImageUrl,
      featured: featured === 'true' || featured === true,
      trending: trending === 'true' || trending === true,
      images,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await product.save();
    
    const productObj = product.toObject();
    productObj.images = productObj.images.sort((a, b) => a.image_order - b.image_order);
    
    console.log('Product created successfully with images:', productObj.images.length);
    res.status(201).json(productObj);
  } catch (error) {
    console.error('Error in product creation:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// POST /api/products/bulk - Bulk import products
router.post('/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required' });
    }
    
    await ensureDatabaseConnection();
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      try {
        const id = product.id || `bulk_${Date.now()}_${index}`;
        
        const productData = {
          _id: id,
          name: product.name || 'Unknown Product',
          brand: product.brand || 'Unknown Brand',
          price: parseFloat(product.price) || 0,
          category: product.category || 'other',
          gender: product.gender || 'unisex',
          model: product.model || '',
          description: product.description || '',
          image_url: product.image_url || '',
          featured: product.featured || false,
          images: [],
          created_at: new Date(),
          updated_at: new Date()
        };
        
        if (product.image_url) {
          productData.images.push({
            image_url: product.image_url,
            image_order: 0,
            is_primary: true
          });
        }
        
        await Product.findOneAndUpdate(
          { _id: id },
          productData,
          { upsert: true, new: true }
        );
        
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({
          index,
          product: product.name || `Product ${index}`,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk import completed`,
      summary: {
        total: products.length,
        successful: successCount,
        failed: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in POST /api/products/bulk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { id } = req.params;
    const {
      name,
      brand,
      price,
      category,
      gender,
      model,
      description,
      featured,
      trending
    } = req.body;
    
    const existingProduct = await Product.findById(id);
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let imageUrl = existingProduct.image_url;
    let images = existingProduct.images || [];
    
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of images) {
        await deleteFromCloudinary(image.image_url);
      }
      
      // Upload new images to Cloudinary
      images = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filename = 'product-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
        const result = await uploadToCloudinary(file.buffer, filename);
        
        if (i === 0) imageUrl = result.secure_url;
        
        images.push({
          image_url: result.secure_url,
          image_order: i,
          is_primary: i === 0
        });
      }
    }
    
    const updateData = {
      name: name || existingProduct.name,
      brand: brand || existingProduct.brand,
      price: price ? parseFloat(price) : existingProduct.price,
      category: category || existingProduct.category,
      gender: gender || existingProduct.gender,
      model: model !== undefined ? model : existingProduct.model,
      description: description !== undefined ? description : existingProduct.description,
      image_url: imageUrl,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingProduct.featured,
      trending: trending !== undefined ? (trending === 'true' || trending === true) : (existingProduct.trending || false),
      images,
      updated_at: new Date()
    };
    
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    
    const productObj = updatedProduct.toObject();
    productObj.images = productObj.images.sort((a, b) => a.image_order - b.image_order);
    
    res.json(productObj);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product permanently
router.delete('/:id', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { id } = req.params;
    
    console.log(`🗑️ Permanently deleting product ${id}...`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete images from Cloudinary
    const images = product.images || [];
    for (const image of images) {
      await deleteFromCloudinary(image.image_url);
    }
    if (product.image_url) {
      await deleteFromCloudinary(product.image_url);
    }
    
    await Product.findByIdAndDelete(id);
    
    console.log(`✅ Product ${id} permanently deleted`);
    res.json({
      message: 'Product permanently deleted',
      id: id
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
