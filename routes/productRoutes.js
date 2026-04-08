const express = require('express');
const productController = require('../controller/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateProduct } = require('../validators/productValidator');
const { upload, compressImages } = require('../middleware/upload');
const { uploadSingle, compressBanner } = require('../middleware/uploadSingle');

const router = express.Router();

// Public routes
router.get('/products', productController.getAllProducts);
router.get('/products/subcategory/:subcategoryId', productController.getProductsBySubcategory);
router.get('/deals/special', productController.getSpecialDealProducts);
router.get('/banners/all', productController.getAllBanners);
router.get('/products/:id', productController.getProduct);
router.get('/products/:id/banner', productController.getBanner);

// Admin routes - with image compression
router.post('/products', authMiddleware, adminMiddleware, upload, compressImages, productController.createProduct);
router.put('/products/:id', authMiddleware, adminMiddleware, upload, compressImages, productController.updateProduct);
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct);
router.post('/products/:id/banner', authMiddleware, adminMiddleware, uploadSingle, compressBanner, productController.uploadBanner);
router.delete('/products/:id/banner', authMiddleware, adminMiddleware, productController.deleteBanner);
router.put('/products/:id/deal', authMiddleware, adminMiddleware, productController.updateSpecialDeal);

module.exports = router;