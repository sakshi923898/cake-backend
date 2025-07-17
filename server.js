const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary'); // ✅ Make sure this file exists
require('dotenv').config();

const ownerAuthRoutes = require('./routes/ownerAuthRoutes');
const Order = require('./models/Order'); // ✅ Make sure model exists
const app = express();

// CORS for Netlify and local dev
app.use(cors({
  origin: ['https://legendary-sprinkles-9e0733.netlify.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use('/api/owner', ownerAuthRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Mongoose Cake model
const Cake = mongoose.model('Cake', new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String,
}));

// ✅ Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cake-shop',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage });

/* --------------------------- Cake Routes -------------------------- */

// Get all cakes
app.get('/api/cakes', async (req, res) => {
  try {
    const cakes = await Cake.find();
    res.json(cakes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cakes' });
  }
});

// Upload new cake
app.post('/api/cakes', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const imageUrl = req.file.path; // ✅ Get Cloudinary image URL
    const newCake = new Cake({ name, price, description, imageUrl });
    await newCake.save();
    res.status(201).json({ message: 'Cake added successfully', cake: newCake });
  } catch (error) {
    console.error('Error uploading cake:', error);
    res.status(500).json({ message: 'Error uploading cake' });
  }
});

// Delete cake
app.delete('/api/cakes/:id', async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);
    if (!cake) return res.status(404).json({ message: 'Cake not found' });
    res.status(200).json({ message: 'Cake deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* -------------------------- Order Routes -------------------------- */

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('cakeId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Place new order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: 'Order placed' });
  } catch (error) {
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Confirm delivery
app.patch('/api/orders/:id/confirm', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'Delivered';
    await order.save();
    res.status(200).json({ message: 'Order confirmed as delivered' });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------- Start App --------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
