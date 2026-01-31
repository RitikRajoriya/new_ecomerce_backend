const express = require('express');
const categoryController = require('../controller/categoryController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateCategory, validateSubcategory } = require('../validators/categoryValidator');
const uploadSingle = require('../middleware/uploadSingle');

const router = express.Router();

// Public routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategory);
router.get('/subcategories', categoryController.getAllSubcategories);
router.get('/subcategories/category/:categoryId', categoryController.getSubcategoriesByCategory);
router.get('/subcategories/:id', categoryController.getSubcategory);

// Admin routes
router.post('/categories', authMiddleware, adminMiddleware, uploadSingle, validateCategory, categoryController.createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, uploadSingle, validateCategory, categoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

router.post('/subcategories', authMiddleware, adminMiddleware, uploadSingle, validateSubcategory, categoryController.createSubcategory);
router.put('/subcategories/:id', authMiddleware, adminMiddleware, uploadSingle, validateSubcategory, categoryController.updateSubcategory);
router.delete('/subcategories/:id', authMiddleware, adminMiddleware, categoryController.deleteSubcategory);

module.exports = router;