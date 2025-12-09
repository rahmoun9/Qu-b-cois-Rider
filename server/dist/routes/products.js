"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Product_1 = __importDefault(require("../models/Product"));
const seedProducts_1 = require("../data/seedProducts");
const router = (0, express_1.Router)();
/**
 * GET /api/products
 * Optionnel: ?q=texte_de_recherche
 */
router.get("/", async (req, res) => {
    try {
        const q = req.query.q?.trim();
        const filter = {};
        if (q && q.length > 0) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ];
        }
        const items = await Product_1.default.find(filter).sort({ createdAt: -1 });
        res.json(items);
    }
    catch (err) {
        console.error("GET /products error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const p = await Product_1.default.findById(req.params.id);
        if (!p)
            return res.status(404).json({ error: "Not found" });
        res.json(p);
    }
    catch (err) {
        console.error("GET /products/:id error:", err);
        res.status(400).json({ error: "Invalid id" });
    }
});
/**
 * POST /api/products
 * body: { title, description?, price, category?, images?: string[], stock? }
 */
router.post("/", async (req, res) => {
    try {
        const { title, description, price, category, images, stock } = req.body;
        if (!title || typeof price !== "number") {
            return res
                .status(400)
                .json({ error: "title (string) et price (number) sont requis" });
        }
        const created = await Product_1.default.create({
            title: String(title),
            description: description ? String(description) : undefined,
            price: Number(price),
            category: category ? String(category) : undefined,
            images: Array.isArray(images) ? images.map(String) : [],
            stock: typeof stock === "number" ? stock : 0,
        });
        res.status(201).json(created);
    }
    catch (err) {
        console.error("POST /products error:", err);
        res.status(500).json({ error: "Create failed" });
    }
});
/**
 * PUT /api/products/:id
 * body: champs partiels possibles
 */
router.put("/:id", async (req, res) => {
    try {
        const payload = {};
        const allowed = ["title", "description", "price", "category", "images", "stock", "popularity", "compatibility"];
        for (const k of allowed) {
            if (k in req.body)
                payload[k] = req.body[k];
        }
        const updated = await Product_1.default.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated)
            return res.status(404).json({ error: "Not found" });
        res.json(updated);
    }
    catch (err) {
        console.error("PUT /products/:id error:", err);
        res.status(400).json({ error: "Update failed" });
    }
});
/**
 * DELETE /api/products/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const del = await Product_1.default.findByIdAndDelete(req.params.id);
        if (!del)
            return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("DELETE /products/:id error:", err);
        res.status(400).json({ error: "Delete failed" });
    }
});
/**
 * Seed pour remplir 15 produits de test
 * GET /api/products/__dev/seed
 */
router.get("/__dev/seed", async (_req, res) => {
    try {
        const result = await (0, seedProducts_1.seedProductsIfEmpty)();
        res.json({
            ok: true,
            inserted: result.inserted,
            skipped: result.skipped,
            message: result.skipped ? "Database already has products" : "Seed inserted",
        });
    }
    catch (err) {
        console.error("SEED error:", err);
        res.status(500).json({ error: "Seed failed" });
    }
});
exports.default = router;
