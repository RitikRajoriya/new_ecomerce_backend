const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');
const Product = require('./models/Product');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '9876543210',
    address: '123 Main St, Pachmarhi, MP',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'user@example.com',
    password: 'user123',
    phone: '9876543211',
    address: '456 Market St, Pachmarhi, MP',
    role: 'user'
  }
];

const categories = [
  {
    name: 'Handicrafts',
    description: 'Traditional Indian handicraft items',
    image: 'https://images.unsplash.com/photo-1605218427306-635ba2439af2?w=500&h=500&fit=crop'
  },
  {
    name: 'Clothing',
    description: 'Traditional and modern clothing items',
    image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=500&h=500&fit=crop'
  },
  {
    name: 'Home Decor',
    description: 'Beautiful home decoration items',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&h=500&fit=crop'
  },
  {
    name: 'Jewelry',
    description: 'Traditional and fashion jewelry',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop'
  }
];

const subcategories = [
  {
    name: 'Wooden Crafts',
    description: 'Handcrafted wooden items',
    category: null, // Will be set dynamically
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&h=500&fit=crop'
  },
  {
    name: 'Pottery',
    description: 'Clay and ceramic pottery items',
    category: null,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&h=500&fit=crop'
  },
  {
    name: "Men's Clothing",
    description: 'Traditional men wear',
    category: null,
    image: 'https://images.unsplash.com/photo-1593032465175-d81f0f53d35f?w=500&h=500&fit=crop'
  },
  {
    name: "Women's Clothing",
    description: 'Traditional women wear',
    category: null,
    image: 'https://images.unsplash.com/photo-1583391733958-e04f94f24961?w=500&h=500&fit=crop'
  },
  {
    name: 'Wall Art',
    description: 'Decorative wall hangings',
    category: null,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&h=500&fit=crop'
  },
  {
    name: 'Lighting',
    description: 'Decorative lights and lamps',
    category: null,
    image: 'https://images.unsplash.com/photo-1513506003013-d803a1bf51d0?w=500&h=500&fit=crop'
  },
  {
    name: 'Necklaces',
    description: 'Traditional necklaces',
    category: null,
    image: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=500&h=500&fit=crop'
  },
  {
    name: 'Earrings',
    description: 'Traditional earrings',
    category: null,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop'
  }
];

const products = [
  {
    name: 'Hand-carved Wooden Box',
    description: 'Beautiful handcrafted wooden box with intricate designs. Perfect for storing jewelry or small items.',
    subcategory: null, // Will be set dynamically
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop'
    ],
    brand: 'Artisan Crafts',
    variations: [
      { size: 'Small', price: 499, stock: 20 },
      { size: 'Medium', price: 799, stock: 15 },
      { size: 'Large', price: 1299, stock: 10 }
    ],
    isSpecialDeal: false
  },
  {
    name: 'Clay Pot Set',
    description: 'Set of 3 traditional clay pots. Eco-friendly and perfect for cooking or decoration.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=800&fit=crop'
    ],
    brand: 'Traditional Arts',
    variations: [
      { size: 'Set of 3', price: 899, stock: 25 }
    ],
    isSpecialDeal: true,
    dealDiscount: 20,
    dealStartDate: new Date(),
    dealEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    name: 'Kurta Pajama Set',
    description: 'Traditional cotton kurta pajama set. Comfortable and stylish for festive occasions.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1593032465175-d81f0f53d35f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1593032465175-d81f0f53d35f?w=800&h=800&fit=crop'
    ],
    brand: 'Ethnic Wear',
    variations: [
      { size: 'M', price: 1299, stock: 30 },
      { size: 'L', price: 1299, stock: 25 },
      { size: 'XL', price: 1399, stock: 20 }
    ],
    isSpecialDeal: false
  },
  {
    name: 'Saree - Banarasi Silk',
    description: 'Beautiful Banarasi silk saree with golden zari work. Perfect for weddings and special occasions.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1583391733958-e04f94f24961?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583391733958-e04f94f24961?w=800&h=800&fit=crop'
    ],
    brand: 'Silk Heritage',
    variations: [
      { size: 'Standard', price: 4999, stock: 10 }
    ],
    isSpecialDeal: true,
    dealDiscount: 15,
    dealStartDate: new Date(),
    dealEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  {
    name: 'Madhubani Wall Painting',
    description: 'Hand-painted Madhubani art on canvas. Traditional Indian folk art from Bihar.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop'
    ],
    brand: 'Folk Art Studio',
    variations: [
      { size: '12x16 inches', price: 1599, stock: 15 },
      { size: '16x20 inches', price: 2499, stock: 10 }
    ],
    isSpecialDeal: false
  },
  {
    name: 'Brass Diya Lamp Set',
    description: 'Set of 5 traditional brass diyas. Perfect for puja and home decoration.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1513506003013-d803a1bf51d0?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513506003013-d803a1bf51d0?w=800&h=800&fit=crop'
    ],
    brand: 'Metal Crafts',
    variations: [
      { size: 'Small (3 inch)', price: 699, stock: 40 },
      { size: 'Medium (4 inch)', price: 999, stock: 30 }
    ],
    isSpecialDeal: false
  },
  {
    name: 'Temple Necklace Set',
    description: 'Traditional temple jewelry necklace set with matching earrings. Gold-plated finish.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=800&h=800&fit=crop'
    ],
    brand: 'Jewels of India',
    variations: [
      { size: 'Standard', price: 2999, stock: 12 }
    ],
    isSpecialDeal: true,
    dealDiscount: 25,
    dealStartDate: new Date(),
    dealEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  },
  {
    name: 'Jhumka Earrings',
    description: 'Traditional bell-shaped jhumka earrings. Antique gold finish with intricate detailing.',
    subcategory: null,
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop'
    ],
    brand: 'Jewels of India',
    variations: [
      { size: 'Small', price: 599, stock: 50 },
      { size: 'Large', price: 899, stock: 35 }
    ],
    isSpecialDeal: false
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('\n⚠ Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Subcategory.deleteMany({});
    await Product.deleteMany({});
    console.log('✓ Existing data cleared');

    // Insert users
    console.log('\n⚠ Inserting users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`  - Created user: ${user.email} (${user.role})`);
    }
    console.log('✓ Users created successfully');

    // Insert categories
    console.log('\n⚠ Inserting categories...');
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = await Category.create(categoryData);
      createdCategories.push(category);
      console.log(`  - Created category: ${category.name}`);
    }
    console.log('✓ Categories created successfully');

    // Assign categories to subcategories
    let categoryIndex = 0;
    subcategories.forEach((subcat, index) => {
      if (index % 2 === 0 && index < subcategories.length - 1) {
        categoryIndex = Math.floor(index / 2);
      }
      subcat.category = createdCategories[categoryIndex]._id;
    });

    // Insert subcategories
    console.log('\n⚠ Inserting subcategories...');
    const createdSubcategories = [];
    for (const subcategoryData of subcategories) {
      const subcategory = await Subcategory.create(subcategoryData);
      createdSubcategories.push(subcategory);
      console.log(`  - Created subcategory: ${subcategory.name}`);
    }
    console.log('✓ Subcategories created successfully');

    // Assign subcategories to products
    products.forEach((product, index) => {
      product.subcategory = createdSubcategories[index]._id;
    });

    // Insert products
    console.log('\n⚠ Inserting products...');
    for (const productData of products) {
      const product = await Product.create(productData);
      console.log(`  - Created product: ${product.name}`);
    }
    console.log('✓ Products created successfully');

    // Summary
    console.log('\n========================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Subcategories: ${createdSubcategories.length}`);
    console.log(`Products: ${products.length}`);
    console.log('========================================\n');

    console.log('📝 LOGIN CREDENTIALS:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
