const express = require('express');
const productController = require('../controller/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateProduct } = require('../validators/productValidator');
const upload = require('../middleware/upload');
const uploadSingle = require('../middleware/uploadSingle');

const router = express.Router();

// Public routes
router.get('/products', productController.getAllProducts);
router.get('/products/subcategory/:subcategoryId', productController.getProductsBySubcategory);
router.get('/deals/special', productController.getSpecialDealProducts);
router.get('/banners/all', productController.getAllBanners);
router.get('/products/:id', productController.getProduct);
router.get('/products/:id/banner', productController.getBanner);

// Admin routes
router.post('/products', authMiddleware, adminMiddleware, upload, productController.createProduct);
router.put('/products/:id', authMiddleware, adminMiddleware, upload, productController.updateProduct);
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct);
router.post('/products/:id/banner', authMiddleware, adminMiddleware, uploadSingle, productController.uploadBanner);
router.put('/products/:id/deal', authMiddleware, adminMiddleware, productController.updateSpecialDeal);

module.exports = router;