"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProducts = void 0;
exports.seedProductsIfEmpty = seedProductsIfEmpty;
const Product_1 = __importDefault(require("../models/Product"));
exports.seedProducts = [
    {
        title: "Nightfall Full-Face Helmet",
        description: "Lightweight ABS shell with internal sun visor and quick-release cheek pads for all-day comfort.",
        price: 219.99,
        category: "helmets",
        images: ["https://images.unsplash.com/photo-1502877828070-33b167ad6860?auto=format&fit=crop&w=900&q=80"],
        stock: 18,
        popularity: 5,
        compatibility: "Street / Sport",
    },
    {
        title: "Atlas Carbon Shield Helmet",
        description: "Carbon weave shell, Pinlock-ready visor, and optimized airflow for long rides in any weather.",
        price: 329.0,
        category: "helmets",
        images: ["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80"],
        stock: 12,
        popularity: 5,
        compatibility: "Sport / Track",
    },
    {
        title: "Stormguard Leather Jacket",
        description: "1.2 mm cowhide, CE level 2 armor, and stretch panels for a close but flexible fit.",
        price: 259.5,
        category: "jackets",
        images: ["https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=900&q=80"],
        stock: 20,
        popularity: 4,
        compatibility: "Street / Touring",
    },
    {
        title: "Apex Textile Jacket",
        description: "Three-season shell with removable thermal liner, waterproof membrane, and chest vents.",
        price: 189.0,
        category: "jackets",
        images: ["https://images.unsplash.com/photo-1511415519840-0e12902e5a38?auto=format&fit=crop&w=900&q=80"],
        stock: 24,
        popularity: 4,
        compatibility: "ADV / Touring",
    },
    {
        title: "Nordic Winter Gloves",
        description: "Insulated gauntlet glove with hard knuckle armor, Hipora waterproof liner, and visor wipe.",
        price: 74.9,
        category: "gloves",
        images: ["https://images.unsplash.com/photo-1516478177764-9fe5bdc5aff3?auto=format&fit=crop&w=900&q=80"],
        stock: 40,
        popularity: 4,
        compatibility: "Cold weather",
    },
    {
        title: "Boreal Mesh Gloves",
        description: "Short cuff glove with full mesh backhand, palm slider, and touchscreen fingertips.",
        price: 49.5,
        category: "gloves",
        images: ["https://images.unsplash.com/photo-1542293772-660bea2c49c1?auto=format&fit=crop&w=900&q=80"],
        stock: 55,
        popularity: 4,
        compatibility: "Summer",
    },
    {
        title: "Armored Riding Jeans",
        description: "Cordura denim with Kevlar panels, included CE hip and knee armor, and tapered fit.",
        price: 149.0,
        category: "pants",
        images: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80"],
        stock: 28,
        popularity: 4,
        compatibility: "Street",
    },
    {
        title: "Reinforced Zip Hoodie",
        description: "Casual look with aramid lining, back protector pocket, and discrete armor at elbows and shoulders.",
        price: 129.0,
        category: "casual",
        images: ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"],
        stock: 32,
        popularity: 3,
        compatibility: "Urban",
    },
    {
        title: "Long Range Touring Boots",
        description: "Full height waterproof boot with shin plate, reinforced shank, and grippy enduro sole.",
        price: 199.0,
        category: "boots",
        images: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80"],
        stock: 22,
        popularity: 5,
        compatibility: "ADV / Touring",
    },
    {
        title: "Urban Ride Sneakers",
        description: "Casual sneaker silhouette hiding ankle cups, heel/toe reinforcement, and shift pad overlay.",
        price: 149.0,
        category: "boots",
        images: ["https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80"],
        stock: 35,
        popularity: 4,
        compatibility: "Urban",
    },
    {
        title: "Mag-Lock Tank Bag 9L",
        description: "Low profile tank bag with magnetic base, map pocket, rain cover, and pass-through cable port.",
        price: 89.0,
        category: "luggage",
        images: ["https://images.unsplash.com/photo-1523419400524-2230bcd99ce1?auto=format&fit=crop&w=900&q=80"],
        stock: 26,
        popularity: 3,
        compatibility: "Magnetic tanks",
    },
    {
        title: "DryRoll Tail Bag 30L",
        description: "Roll-top waterproof tail pack with quick-release straps and reflective webbing for visibility.",
        price: 109.0,
        category: "luggage",
        images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
        stock: 30,
        popularity: 4,
        compatibility: "Universal",
    },
    {
        title: "LED Auxiliary Light Kit",
        description: "Pair of 3 inch pods with aluminum housings, wiring harness, and handlebar switch.",
        price: 169.0,
        category: "lighting",
        images: ["https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80"],
        stock: 18,
        popularity: 4,
        compatibility: "12V systems",
    },
    {
        title: "Enduro Handguards",
        description: "Aluminum backbone with impact-resistant shields to protect levers and hands off-road.",
        price: 59.0,
        category: "protection",
        images: ["https://images.unsplash.com/photo-1514053026555-49ce8886ae41?auto=format&fit=crop&w=900&q=80"],
        stock: 34,
        popularity: 3,
        compatibility: "ADV / Dual-sport",
    },
    {
        title: "520 Chain and Sprocket Kit",
        description: "Steel front and rear sprockets with O-ring chain for longer service intervals.",
        price: 139.0,
        category: "maintenance",
        images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80"],
        stock: 25,
        popularity: 4,
        compatibility: "Universal 520",
    },
];
// Helper to seed in both route and CLI
async function seedProductsIfEmpty() {
    const count = await Product_1.default.countDocuments();
    if (count > 0) {
        return { inserted: 0, skipped: true };
    }
    await Product_1.default.insertMany(exports.seedProducts);
    return { inserted: exports.seedProducts.length, skipped: false };
}
