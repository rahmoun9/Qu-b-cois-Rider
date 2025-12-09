"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (req, res) => {
    const orders = await Order_1.default.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "items requis" });
        }
        const ids = items.map((it) => it.productId);
        const products = await Product_1.default.find({ _id: { $in: ids } }).lean();
        const map = new Map(products.map((p) => [String(p._id), p]));
        const orderItems = items.map((it) => {
            const p = map.get(String(it.productId));
            if (!p)
                throw new Error(`Produit introuvable: ${it.productId}`);
            return {
                product: it.productId,
                title: p.title,
                price: Number(p.price),
                qty: Math.max(1, Number(it.qty) || 1),
            };
        });
        const total = orderItems.reduce((sum, it) => sum + it.price * it.qty, 0);
        const order = await Order_1.default.create({
            user: req.user._id,
            items: orderItems,
            total,
            status: "pending",
        });
        res.status(201).json(order);
    }
    catch (err) {
        console.error("POST /orders error", err);
        res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
});
exports.default = router;
