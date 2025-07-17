const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  cakeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cake',
    required: true,
  },
});

module.exports = mongoose.model('Order', orderSchema);
