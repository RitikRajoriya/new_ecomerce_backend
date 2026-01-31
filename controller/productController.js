const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');

// Create Product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, subcategory, variations, brand } = req.body;

    // Build image URLs
    const images = req.files ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`) : [];

    // Check if subcategory exists
    const existingSubcategory = await Subcategory.findById(subcategory);

    if (!existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory not found',
      });
    }

    // Validate variations
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variation is required',
      });
    }

    // Check for duplicate sizes in variations
    const sizes = variations.map(v => v.size);
    if (new Set(sizes).size !== sizes.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate sizes are not allowed in variations',
      });
    }

    // Create new product
    const product = new Product({
      name,
      description,
      subcategory,
      images,
      variations,
      brand,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all products (Public)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, subcategory, minPrice, maxPrice, size } = req.query;

    let query = { isActive: true };

    if (subcategory) {
      query.subcategory = subcategory;
    }

    if (minPrice || maxPrice) {
      query['variations.price'] = {};
      if (minPrice) query['variations.price'].$gte = parseFloat(minPrice);
      if (maxPrice) query['variations.price'].$lte = parseFloat(maxPrice);
    }

    if (size) {
      query['variations.size'] = size;
    }

    const products = await Product.find(query)
      .populate('subcategory', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get products by subcategory (Public)
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const products = await Product.find({
      subcategory: req.params.subcategoryId,
      isActive: true
    }).populate('subcategory', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get single product (Public)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('subcategory', 'name category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, subcategory, variations, brand, isActive } = req.body;

    // Build image URLs if files uploaded
    const images = req.files && req.files.length > 0 ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`) : undefined;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if subcategory exists
    if (subcategory) {
      const existingSubcategory = await Subcategory.findById(subcategory);
      if (!existingSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory not found',
        });
      }
    }

    // Validate variations if provided
    if (variations) {
      if (!Array.isArray(variations) || variations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one variation is required',
        });
      }

      const sizes = variations.map(v => v.size);
      if (new Set(sizes).size !== sizes.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate sizes are not allowed in variations',
        });
      }
    }

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.subcategory = subcategory || product.subcategory;
    product.images = images !== undefined ? images : product.images;
    product.variations = variations || product.variations;
    product.brand = brand !== undefined ? brand : product.brand;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};