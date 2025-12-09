"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Définition du schéma d’un produit
const productSchema = new mongoose_1.default.Schema({
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
}, { timestamps: true });
// Création du modèle (collection "products" dans MongoDB)
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
