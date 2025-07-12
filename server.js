const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const ownerAuthRoutes = require('./routes/ownerAuthRoutes');

const app = express();

// ✅ Allow both Netlify live frontend and local development
app.use(cors({
  origin: ['https://legendary-sprinkles-9e0733.netlify.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/owner', ownerAuthRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Models
const Cake = mongoose.model('Cake', new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String,
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  customerName: String,
  contact: String,
  address: String,
  cakeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cake'
  },
  status: { type: String, default: 'Pending' },
}));

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
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
    const imageUrl = `/uploads/${req.file.filename}`;
    const newCake = new Cake({ name, price, description, imageUrl });
    await newCake.save();
    res.status(201).json({ message: 'Cake added successfully' });
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
    const orderId = req.params.id;
    const updated = await Order.findByIdAndUpdate(orderId, { status: 'Delivered' }, { new: true });
    res.json({ message: 'Order confirmed', order: updated });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Failed to confirm order' });
  }
});

/* ---------------------------- Start App --------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
