const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

// Helper function to get GST rate based on category
const getGSTRate = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId);
    if (!category) return 0;
    
    const categoryName = category.name.toLowerCase();
    
    // Category-based GST rates
    if (categoryName.includes('cloth')) return 5;
    if (categoryName.includes('accessor')) return 3; // Jewellery, Accessories
    if (categoryName.includes('jewell')) return 3;
    if (categoryName.includes('bag')) return 5;
    if (categoryName.includes('hand')) return 5;
    
    return 0; // Default
  } catch (error) {
    console.error('Error getting GST rate:', error);
    return 0;
  }
};

// Calculate base price from GST-included price (reverse GST calculation)
const calculateBasePrice = (finalPrice, taxRate) => {
  return finalPrice / (1 + taxRate / 100);
};

// Calculate tax amount from GST-included price
const calculateTaxAmount = (finalPrice, taxRate) => {
  const basePrice = calculateBasePrice(finalPrice, taxRate);
  return finalPrice - basePrice;
};

// Create Product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, brand, category, subcategory, productType, taxRate, variations } = req.body;

    // Parse variations if string (form-data fix)
    let parsedVariations = variations;
    if (typeof variations === 'string') {
      try {
        parsedVariations = JSON.parse(variations);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Variations must be valid JSON',
        });
      }
    }

    // Validate variations
    if (!parsedVariations || !Array.isArray(parsedVariations) || parsedVariations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variation is required',
      });
    }

    // Build image URLs
    const images = req.files && req.files.length > 0 
      ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
      : [];

    // Check subcategory
    if (!subcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory is required',
      });
    }

    const existingSubcategory = await Subcategory.findById(subcategory);
    if (!existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory not found',
      });
    }

    // Auto-assign GST rate based on category if not provided
    let finalTaxRate = taxRate;
    if (!finalTaxRate && subcategory) {
      finalTaxRate = await getGSTRate(existingSubcategory.category);
    }

    // Prepare variations based on productType
    const preparedVariations = parsedVariations.map(v => {
      const variation = {
        price: parseFloat(v.price),
        stock: parseInt(v.stock),
      };

      if (productType === 'SIZE') {
        if (!v.size) throw new Error('Size is required for SIZE type products');
        variation.size = v.size;
      } else if (productType === 'UNIT') {
        if (!v.unit || v.value === undefined) {
          throw new Error('Unit and value are required for UNIT type products');
        }
        variation.unit = v.unit;
        variation.value = parseFloat(v.value);
      } else if (productType === 'COLOR') {
        if (!v.color) throw new Error('Color is required for COLOR type products');
        variation.color = v.color;
      } else {
        // SINGLE or default
        variation.size = 'M';
      }

      return variation;
    });

    // Save product
    const product = new Product({
      name,
      description,
      brand,
      category: existingSubcategory.category,
      subcategory,
      productType: productType || 'SINGLE',
      taxRate: finalTaxRate || 0,
      variations: preparedVariations || [], // SAFE: Always array
      images: images || [], // SAFE: Always array
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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

    // Add calculated prices to each product (GST-inclusive pricing)
    const productsWithPrices = products.map(product => {
      const productObj = product.toObject();
      let finalPrice = 0;
      let basePrice = 0;
      let taxAmount = 0;
      
      if (product.variations && product.variations.length > 0) {
        finalPrice = product.variations[0].price; // GST-included price
        basePrice = calculateBasePrice(finalPrice, product.taxRate);
        taxAmount = calculateTaxAmount(finalPrice, product.taxRate);
      }
      
      return {
        ...productObj,
        finalPrice,      // Price shown to customer (GST included)
        basePrice,       // Base price before GST
        taxAmount,       // GST amount
        price: finalPrice, // For backward compatibility
      };
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products: productsWithPrices || [], // SAFE: Always return array
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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
      products: products || [], // SAFE: Always return array
    });
  } catch (error) {
    console.error('Get products by subcategory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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

    console.log('=== RAW PRODUCT FROM DB ===');
    console.log('Product ID:', product._id);
    console.log('Variations:', JSON.stringify(product.variations, null, 2));
    console.log('Images:', JSON.stringify(product.images, null, 2));
    console.log('Tax Rate:', product.taxRate);
    console.log('Product Type:', product.productType);

    // Return COMPLETE product object with ALL fields
    res.status(200).json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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
    const { name, description, brand, category, subcategory, productType, taxRate, variations, isActive } = req.body;

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Build image URLs
    const images = req.files && req.files.length > 0 
      ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
      : [];

    // Parse variations if string
    let parsedVariations = variations;
    if (typeof variations === 'string') {
      try {
        parsedVariations = JSON.parse(variations);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Variations must be valid JSON',
        });
      }
    }

    // Validate and prepare variations based on productType
    if (parsedVariations && Array.isArray(parsedVariations)) {
      const preparedVariations = parsedVariations.map(v => {
        const variation = {
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
        };

        if (productType === 'SIZE') {
          if (!v.size) throw new Error('Size is required for SIZE type products');
          variation.size = v.size;
        } else if (productType === 'UNIT') {
          if (!v.unit || v.value === undefined) {
            throw new Error('Unit and value are required for UNIT type products');
          }
          variation.unit = v.unit;
          variation.value = parseFloat(v.value);
        } else if (productType === 'COLOR') {
          if (!v.color) throw new Error('Color is required for COLOR type products');
          variation.color = v.color;
        } else {
          variation.size = 'M';
        }

        return variation;
      });

      product.variations = preparedVariations;
    }

    // Update fields
    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.brand = brand !== undefined ? brand : product.brand;
    product.category = category !== undefined ? category : product.category;
    product.subcategory = subcategory || product.subcategory;
    if (images && images.length > 0) {
      product.images = images;
    } else if (!product.images) {
      product.images = []; // SAFE: Ensure array
    }
    if (productType) product.productType = productType;
    if (taxRate !== undefined) product.taxRate = taxRate;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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

// Delete banner for product (Admin only)
exports.deleteBanner = async (req, res) => {
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

    // Check if banner exists
    if (!product.banner) {
      return res.status(400).json({
        success: false,
        message: 'No banner found for this product',
      });
    }

    // Update product to remove banner
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { banner: null },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
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

    // ONLY fetch products where isSpecialDeal is true AND dates are valid
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

    // Return empty array if no deals - NO fallback products
    res.status(200).json({
      success: true,
      count: deals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products: deals,  // Only real deals, empty if none exist
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
        product: updatedProduct, // Return full product object
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