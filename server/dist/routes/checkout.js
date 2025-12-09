"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/checkout.ts
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
const Product_1 = __importDefault(require("../models/Product"));
dotenv_1.default.config(); // ✅ charge server/.env
const router = (0, express_1.Router)();
// ✅ on récupère la clé Stripe depuis .env
const secret = process.env.STRIPE_SECRET;
if (!secret) {
    throw new Error("STRIPE_SECRET manquante dans server/.env");
}
// ✅ on initialise Stripe avec la clé
const stripe = new stripe_1.default(secret, { apiVersion: "2024-06-20" });
// POST /api/checkout
router.post("/", async (req, res) => {
    try {
        // 1) Lire et valider le body
        const { items } = req.body || {};
        // items attendu: [{ productId: string, qty: number }, ...]
        if (!Array.isArray(items) || items.length === 0) {
            return res
                .status(400)
                .json({ error: "items est requis et doit être une liste non vide" });
        }
        // 2) Récupérer les produits (sécuriser les prix côté serveur)
        const ids = items.map((it) => it.productId);
        const products = await Product_1.default.find({ _id: { $in: ids } }).lean();
        const map = new Map(products.map((p) => [String(p._id), p]));
        // 3) Construire les line_items pour Stripe
        const line_items = items.map((it) => {
            const p = map.get(String(it.productId));
            if (!p)
                throw new Error(`Produit introuvable: ${it.productId}`);
            const qty = Number(it.qty) || 1;
            return {
                quantity: qty,
                price_data: {
                    currency: "cad",
                    unit_amount: Math.round(Number(p.price) * 100), // dollars -> cents
                    product_data: {
                        name: p.title,
                        description: p.description?.slice(0, 120) || undefined,
                        images: Array.isArray(p.images) ? p.images.slice(0, 1) : [],
                    },
                },
            };
        });
        // 4) Créer la session de paiement
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items,
            success_url: "http://localhost:5173/?paid=1",
            cancel_url: "http://localhost:5173/?canceled=1",
        });
        return res.json({ url: session.url }); // on renvoie l’URL de redirection
    }
    catch (err) {
        console.error("[checkout] error:", err);
        return res.status(500).json({ error: err?.message || "Erreur interne" });
    }
});
exports.default = router;
