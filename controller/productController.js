const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');

// Create Product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    let { name, description, subcategory, variations, brand } = req.body;

    console.log('Raw variations:', variations);
    console.log('Type before parse:', typeof variations);

    // Parse variations (form-data fix)
    if (typeof variations === 'string') {
      try {
        variations = JSON.parse(variations);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Variations must be valid JSON',
        });
      }
    }
    

    // Validate variations
    if (!Array.isArray(variations) || variations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variation is required',
      });
    }

   
    const images = req.files
      ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
      : [];

    // Check subcategory
    const existingSubcategory = await Subcategory.findById(subcategory);
    if (!existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory not found',
      });
    }

    // Duplicate size check
    const sizes = variations.map(v => v.size);
    if (new Set(sizes).size !== sizes.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate sizes are not allowed in variations',
      });
    }

    // Save product
    const product = new Product({
      name,
      description,
      subcategory,
      brand,
      variations,
      images,
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

// Get banner for product (Public)
exports.getBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).select('banner name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found for this product',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        banner: product.banner,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all banners/carousels (Public)
exports.getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const banners = await Product.find({ banner: { $ne: null } })
      .select('name banner images isActive')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ banner: { $ne: null } });

    res.status(200).json({
      success: true,
      count: banners.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: banners,
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
    let { name, description, subcategory, variations, brand, isActive } = req.body;

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
      if (typeof variations === 'string') {
        try {
        variations = JSON.parse(variations);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Variations must be valid JSON',
        });
      }
      }
    

    // Validate variations
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

// Upload banner for product (Admin only)
exports.uploadBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Generate banner URL
    const bannerUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Update product with banner
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { banner: bannerUrl },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        banner: updatedProduct.banner,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all special deal products (Public)
exports.getSpecialDealProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const deals = await Product.find({
      isSpecialDeal: true,
      isActive: true,
      dealStartDate: { $lte: new Date() },
      dealEndDate: { $gte: new Date() }
    })
      .populate('subcategory', 'name category')
      .sort({ dealDiscount: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({
      isSpecialDeal: true,
      isActive: true,
      dealStartDate: { $lte: new Date() },
      dealEndDate: { $gte: new Date() }
    });

    res.status(200).json({
      success: true,
      count: deals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: deals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Create/Update special deal (Admin only)
exports.updateSpecialDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSpecialDeal, dealDiscount, dealStartDate, dealEndDate } = req.body;

    // Validate product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate deal data
    if (isSpecialDeal) {
      if (!dealDiscount || dealDiscount < 0 || dealDiscount > 100) {
        return res.status(400).json({
          success: false,
          message: 'Deal discount must be between 0 and 100',
        });
      }

      if (!dealStartDate || !dealEndDate) {
        return res.status(400).json({
          success: false,
          message: 'Deal start and end dates are required',
        });
      }

      const startDate = new Date(dealStartDate);
      const endDate = new Date(dealEndDate);

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Deal end date must be after start date',
        });
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        isSpecialDeal: isSpecialDeal || false,
        dealDiscount: isSpecialDeal ? dealDiscount : 0,
        dealStartDate: isSpecialDeal ? new Date(dealStartDate) : null,
        dealEndDate: isSpecialDeal ? new Date(dealEndDate) : null,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: isSpecialDeal ? 'Special deal created/updated successfully' : 'Special deal removed successfully',
      data: {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        isSpecialDeal: updatedProduct.isSpecialDeal,
        dealDiscount: updatedProduct.dealDiscount,
        dealStartDate: updatedProduct.dealStartDate,
        dealEndDate: updatedProduct.dealEndDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};