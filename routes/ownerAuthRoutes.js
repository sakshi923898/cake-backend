const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Owner = require('../models/Owner'); // Make sure this path is correct

// Owner login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ ownerId: owner._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
