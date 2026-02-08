import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  ticket_type: { type: String, default: 'single' },
  quantity: { type: Number, required: true, min: 1 },
  total_amount: { type: Number, required: true },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  checkout_id: { type: String },
  transaction_id: { type: String },
  qr_code: { type: String },
  scanned: { type: Boolean, default: false },
  scanned_at: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Update updated_at on save - handled automatically by Mongoose
// OrderSchema.pre('save', function(done) {
//   this.updated_at = new Date();
//   done();
// });

// Indexes for fast lookups (remove duplicate ticket_id index since it's unique)
OrderSchema.index({ checkout_id: 1 });
OrderSchema.index({ payment_status: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);