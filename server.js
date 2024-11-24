// CS0043 Source Code Template for 2T AY 2022-2023
/*
    Program: Application Development
    Programmer: Zach Stephan A. Magistrado
    Section: AN22
    Start Date: July 16, 2023
    End Date: July 17, 2023

*/

// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

// MongoDB connection
mongoose.connect('mongodb+srv://admin:admin123@sandbox.5vkud19.mongodb.net/an22_sample_database?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema
const userSchema = new Schema({
  username: String,
  password: String
});

// Product schema
const productSchema = new Schema({
  name: String,
  description: String,
  isActive: Boolean,
  price: Number
});

// Order schema
const orderSchema = new Schema({
    userId: String,
    products: [{ productId: String, quantity: Number }]
  });

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Create Express application
const app = express();
app.use(express.json());

// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User authentication
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the provided password with the stored password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate a JSON Web Token (JWT)
    const token = jwt.sign({ userId: user._id }, 'secret_key');
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to authenticate requests
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = jwt.verify(token, 'secret_key');
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create Product
app.post('/products', authenticateUser, async (req, res) => {
  const { name, description, price } = req.body;

  try {
    const newProduct = new Product({ name, description, isActive: true, price });
    await newProduct.save();

    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve all active products
app.get('/products/active', async (req, res) => {
  try {
    const activeProducts = await Product.find({ isActive: true });
    res.json(activeProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve single product
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Product information
app.put('/products/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive, price } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { name, description, isActive, price },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive Product
app.put('/products/:id/archive', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate Product
app.put('/products/:id/activate', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product activated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Non-admin User checkout (Create Order)
// Non-authenticated User checkout (Create Order)
// Non-authenticated User checkout (Create Order)
app.post('/checkout', async (req, res) => {
    try {
      // Get user cart or products to checkout
      const { products } = req.body;
  
      // Create a new order
      const newOrder = new Order({ products: [] });
  
      // Add products to the newOrder object
      for (const product of products) {
        const { productId, quantity } = product;
        newOrder.products.push({ productId, quantity });
      }
  
      // Save the new order to the database
      await newOrder.save();
  
      res.status(201).json({ message: 'Order created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// Add to Cart
app.post('/cart', authenticateUser, async (req, res) => {
    const { userId } = req;
    const { productId, quantity } = req.body;
  
    try {
      // Find the user and the product
      const user = await User.findById(userId);
      const product = await Product.findById(productId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Add the product to the user's cart or update the quantity
      const existingCartItem = user.cart.find((item) => item.productId === productId);
  
      if (existingCartItem) {
        existingCartItem.quantity += quantity;
      } else {
        user.cart.push({ productId, quantity });
      }
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Change product quantities in the cart
  app.put('/cart/:productId', authenticateUser, async (req, res) => {
    const { userId } = req;
    const { productId } = req.params;
    const { quantity } = req.body;
  
    try {
      // Find the user and the product in the cart
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const cartItem = user.cart.find((item) => item.productId === productId);
  
      if (!cartItem) {
        return res.status(404).json({ error: 'Product not found in the cart' });
      }
  
      // Update the quantity
      cartItem.quantity = quantity;
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: 'Cart item quantity updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Remove products from the cart
  app.delete('/cart/:productId', authenticateUser, async (req, res) => {
    const { userId } = req;
    const { productId } = req.params;
  
    try {
      // Find the user and the product in the cart
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const cartItemIndex = user.cart.findIndex((item) => item.productId === productId);
  
      if (cartItemIndex === -1) {
        return res.status(404).json({ error: 'Product not found in the cart' });
      }
  
      // Remove the product from the cart
      user.cart.splice(cartItemIndex, 1);
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: 'Product removed from cart successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Subtotal for each item in the cart
  const calculateSubtotal = async (productId, quantity) => {
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        throw new Error('Product not found');
      }
  
      const subtotal = product.price * quantity;
      return subtotal;
    } catch (error) {
      console.error(error);
      throw new Error('Internal server error');
    }
  };
  
  // Total price for all items in the cart
  const calculateTotalPrice = async (cart) => {
    let totalPrice = 0;
  
    for (const item of cart) {
      const { productId, quantity } = item;
      const subtotal = await calculateSubtotal(productId, quantity);
      totalPrice += subtotal;
    }
  
    return totalPrice;
  };
  
  // Retrieve user's cart
  app.get('/cart', authenticateUser, async (req, res) => {
    const { userId } = req;
  
    try {
      const user = await User.findById(userId).populate('cart.productId');
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const cart = user.cart.map((item) => {
        const { productId, quantity } = item;
        const product = {
          _id: productId._id,
          name: productId.name,
          description: productId.description,
          price: productId.price,
          quantity
        };
        return product;
      });
  
      const totalPrice = await calculateTotalPrice(user.cart);
  
      res.json({ cart, totalPrice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Retrieve user details
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Retrieve all orders
app.get('/orders', async (req, res) => {
    try {
      const orders = await Order.find();
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user isAdmin status
app.put('/users/:id/set-admin', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findByIdAndUpdate(id, { isAdmin: true }, { new: true });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ message: 'User isAdmin status updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

  // Start the server
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
  
