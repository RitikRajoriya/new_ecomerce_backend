const express = require('express');
const productController = require('../controller/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateProduct } = require('../validators/productValidator');

const router = express.Router();

// Public routes
router.get('/products', productController.getAllProducts);
router.get('/products/subcategory/:subcategoryId', productController.getProductsBySubcategory);
router.get('/products/:id', productController.getProduct);

// Admin routes
router.post('/products', authMiddleware, adminMiddleware, validateProduct, productController.createProduct);
router.put('/products/:id', authMiddleware, adminMiddleware, validateProduct, productController.updateProduct);
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;