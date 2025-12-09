"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const auth_1 = require("../middleware/auth");
dotenv_1.default.config();
const secret = process.env.STRIPE_SECRET;
if (!secret) {
    throw new Error("STRIPE_SECRET manquante dans server/.env");
}
const stripeUnavailable = secret.startsWith("sk_test_dummy");
const stripe = new stripe_1.default(secret, { apiVersion: "2024-06-20" });
const router = (0, express_1.Router)();
// POST /api/checkout
router.post("/", auth_1.optionalAuth, async (req, res) => {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res
                .status(400)
                .json({ error: "items est requis et doit etre une liste non vide" });
        }
        const ids = items.map((it) => it.productId);
        const products = await Product_1.default.find({ _id: { $in: ids } }).lean();
        const map = new Map(products.map((p) => [String(p._id), p]));
        const line_items = items.map((it) => {
            const p = map.get(String(it.productId));
            if (!p)
                throw new Error(`Produit introuvable: ${it.productId}`);
            const qty = Math.max(1, Number(it.qty) || 1);
            return {
                quantity: qty,
                price_data: {
                    currency: "cad",
                    unit_amount: Math.round(Number(p.price) * 100),
                    product_data: {
                        name: p.title,
                        description: p.description?.slice(0, 120) || undefined,
                        images: Array.isArray(p.images) ? p.images.slice(0, 1) : [],
                    },
                },
            };
        });
        const total = items.reduce((sum, it) => {
            const p = map.get(String(it.productId));
            if (!p)
                return sum;
            return sum + Number(p.price) * (Number(it.qty) || 1);
        }, 0);
        if (stripeUnavailable) {
            return res.status(503).json({
                error: "Stripe non configure. Renseignez STRIPE_SECRET (cle test) dans server/.env",
            });
        }
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items,
            success_url: "http://localhost:5173/?paid=1",
            cancel_url: "http://localhost:5173/?canceled=1",
        });
        if (req.user) {
            await Order_1.default.create({
                user: req.user._id,
                items: items.map((it) => {
                    const p = map.get(String(it.productId));
                    return {
                        product: it.productId,
                        title: p?.title ?? "Produit",
                        price: Number(p?.price ?? 0),
                        qty: Number(it.qty) || 1,
                    };
                }),
                total,
                status: "pending",
                stripeSessionId: session.id,
            });
        }
        return res.json({ url: session.url });
    }
    catch (err) {
        console.error("[checkout] error:", err);
        if (err?.type && String(err.type).includes("Stripe")) {
            return res.status(400).json({ error: "Stripe a refuse la cle ou la requete. Verifiez STRIPE_SECRET." });
        }
        return res.status(500).json({ error: err?.message || "Erreur interne" });
    }
});
exports.default = router;
