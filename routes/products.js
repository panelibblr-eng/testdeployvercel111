const express = require('express');
const router = express.Router();
const { ensureDatabaseConnection } = require('../database/init');
const Product = require('../database/models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

// GET /api/products - Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      // Database not available - return empty array so frontend can use localStorage
      console.log('⚠️ Database not available, returning empty products array');
      return res.json({ success: true, products: [], count: 0, message: 'Database not available. Frontend will use localStorage.' });
    }
    const { category, gender, featured, search, brand, limit, offset } = req.query;
    
    // Build MongoDB query
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
    
    // Build query options
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
    
    // Sort images by image_order and normalize ID
    const productsWithImages = products.map(product => {
      const productObj = product.toObject();
      // Normalize _id to id for frontend compatibility
      if (productObj._id && !productObj.id) {
        productObj.id = productObj._id;
      }
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
      // Database not available - return empty array
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
      // Database not available - return empty stats
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
      // Database not available - return 404
      console.log('⚠️ Database not available');
      return res.status(404).json({ success: false, error: 'Product not found. Database not available.' });
    }
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productObj = product.toObject();
    // Normalize _id to id for frontend compatibility
    if (productObj._id && !productObj.id) {
      productObj.id = productObj._id;
    }
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
    
    // Validate required fields
    if (!name || !brand || !price || !category || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Set primary image URL (first uploaded image or empty)
    const primaryImageUrl = req.files && req.files.length > 0 ? `/uploads/products/${req.files[0].filename}` : '';
    
    // Prepare images array
    const images = req.files ? req.files.map((file, index) => ({
      image_url: `/uploads/products/${file.filename}`,
      image_order: index,
      is_primary: index === 0
    })) : [];
    
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
    // Normalize _id to id for frontend compatibility
    if (productObj._id && !productObj.id) {
      productObj.id = productObj._id;
    }
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
        
        // Add images if provided
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

// POST /api/products/inventory - Bulk import inventory items from CSV
router.post('/inventory', async (req, res) => {
  try {
    const { inventoryItems } = req.body;
    
    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      return res.status(400).json({ error: 'Invalid inventory items data' });
    }
    
    await ensureDatabaseConnection();
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Helper function to map product type to category
    function mapProductTypeToCategory(productType) {
      const type = productType.toLowerCase();
      if (type.includes('sunglass')) return 'sunglasses';
      if (type.includes('frame')) return 'optical-frames';
      if (type.includes('contact') || type.includes('lens')) return 'contact-lenses';
      return 'sunglasses'; // default
    }
    
    // Helper function to extract brand from description
    function extractBrandFromDescription(description) {
      const commonBrands = ['Boss', 'Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Versace', 'Dolce & Gabbana', 'Oakley', 'Acuvue', 'Johnson & Johnson'];
      for (const brand of commonBrands) {
        if (description.toLowerCase().includes(brand.toLowerCase())) {
          return brand;
        }
      }
      return null;
    }
    
    // Process inventory items in batches
    const batchSize = 10;
    for (let i = 0; i < inventoryItems.length; i += batchSize) {
      const batch = inventoryItems.slice(i, i + batchSize);
      
      for (const item of batch) {
        const {
          siNo,
          product,
          productCode,
          description,
          branchName,
          quantity,
          piecesPerBox,
          totalPieces,
          averageUnitPrice,
          averageTaxPercent,
          totalPurchase
        } = item;
        
        // Validate required fields
        if (!product || !productCode || !description || !averageUnitPrice) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: Missing required fields`);
          continue;
        }
        
        try {
          const category = mapProductTypeToCategory(product);
          const brand = extractBrandFromDescription(description) || 'Unknown';
          const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          
          const inventoryData = {
            siNo,
            quantity,
            piecesPerBox,
            totalPieces,
            averageTaxPercent,
            totalPurchase,
            branchName
          };
          
          const updatedDescription = `${description}\n\nInventory Data: ${JSON.stringify(inventoryData)}`;
          
          const productData = {
            _id: id,
            name: description || `${product} ${productCode}`,
            brand,
            price: parseFloat(averageUnitPrice),
            category,
            gender: 'unisex',
            model: productCode,
            description: updatedDescription,
            image_url: '',
            featured: false,
            images: [],
            created_at: new Date(),
            updated_at: new Date()
          };
          
          await Product.create(productData);
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: ${err.message}`);
        }
      }
    }
    
    res.json({
      message: `Inventory import completed. ${results.success} products created, ${results.failed} failed.`,
      results
    });
  } catch (error) {
    console.error('Error in inventory import:', error);
    res.status(500).json({ error: 'Failed to import inventory' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      // Database not available - return error
      console.log('⚠️ Database not available for product update');
      return res.status(503).json({ 
        success: false,
        error: 'Database not available',
        message: 'Cannot update product. Database connection failed. Please try again later or contact support.'
      });
    }
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
    
    // Check if product exists
    const existingProduct = await Product.findById(id);
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Handle image update
    let imageUrl = existingProduct.image_url;
    let images = existingProduct.images || [];
    
    if (req.files && req.files.length > 0) {
      // Delete old image files
      if (images.length > 0) {
        images.forEach(image => {
          const oldImagePath = path.join(__dirname, '../', image.image_url);
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log(`Deleted old image file: ${oldImagePath}`);
            }
          } catch (fileErr) {
            console.error('Error deleting old image file:', fileErr);
          }
        });
      }
      
      // Set new primary image
      imageUrl = `/uploads/products/${req.files[0].filename}`;
      
      // Create new images array
      images = req.files.map((file, index) => ({
        image_url: `/uploads/products/${file.filename}`,
        image_order: index,
        is_primary: index === 0
      }));
    } else if (existingProduct.image_url && existingProduct.image_url.trim() !== '' && images.length === 0) {
      // Migrate image_url to images array if needed
      images = [{
        image_url: existingProduct.image_url,
        image_order: 0,
        is_primary: true
      }];
    }
    
    // Update product
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
    // Normalize _id to id for frontend compatibility
    if (productObj._id && !productObj.id) {
      productObj.id = productObj._id;
    }
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
    try {
      await ensureDatabaseConnection();
    } catch (dbError) {
      // Database not available - return error
      console.log('⚠️ Database not available for product deletion');
      return res.status(503).json({ 
        success: false,
        error: 'Database not available',
        message: 'Cannot delete product. Database connection failed. Please try again later or contact support.'
      });
    }
    const { id } = req.params;
    
    console.log(`🗑️ Permanently deleting product ${id}...`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete image files
    let filesDeleted = 0;
    const images = product.images || [];
    
    if (images.length > 0) {
      images.forEach(image => {
        const imagePath = path.join(__dirname, '../', image.image_url);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            filesDeleted++;
            console.log(`✅ Deleted image file: ${image.image_url}`);
          }
        } catch (fileErr) {
          console.error(`Error deleting image file ${image.image_url}:`, fileErr);
        }
      });
    }
    
    // Delete primary image if exists
    if (product.image_url) {
      const imagePath = path.join(__dirname, '../', product.image_url);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          filesDeleted++;
          console.log(`✅ Deleted primary image file: ${product.image_url}`);
        }
      } catch (fileErr) {
        console.error(`Error deleting primary image file:`, fileErr);
      }
    }
    
    // Delete product from database
    await Product.findByIdAndDelete(id);
    
    console.log(`✅ Product ${id} permanently deleted (${images.length} image records, ${filesDeleted} image files)`);
    res.json({
      message: 'Product permanently deleted',
      id: id,
      imagesDeleted: images.length,
      filesDeleted: filesDeleted
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
