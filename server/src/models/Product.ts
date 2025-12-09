import mongoose from "mongoose";

// Définition du schéma d’un produit
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    promoEndsAt: {
      type: Date,
    },
    category: {
      type: String,
      trim: true,
    },
    images: {
      type: [String], // tableau d’URLs d’images
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    compatibility: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Création du modèle (collection "products" dans MongoDB)
const Product = mongoose.model("Product", productSchema);

export default Product;
