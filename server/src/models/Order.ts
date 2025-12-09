import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "canceled"], default: "pending" },
    stripeSessionId: { type: String },
    shippingAddress: { type: String, trim: true },
    canceledAt: { type: Date },
    cancelReason: { type: String, trim: true },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
