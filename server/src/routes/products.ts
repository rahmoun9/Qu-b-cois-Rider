import { Router } from "express";
import Product from "../models/Product";
import { seedProductsIfEmpty } from "../data/seedProducts";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/products
 * Optionnel: ?q=texte_de_recherche&category=casques&minPrice=0&maxPrice=200&limit=12&page=1
 */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || "50"), 10)));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (q && q.length > 0) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = { $regex: `^${category}$`, $options: "i" };
    if (typeof minPrice === "number" && !Number.isNaN(minPrice)) filter.price = { ...filter.price, $gte: minPrice };
    if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) filter.price = { ...filter.price, $lte: maxPrice };

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(400).json({ error: "Invalid id" });
  }
});

/**
 * POST /api/products
 * body: { title, description?, price, category?, images?: string[], stock?, salePrice?, promoEndsAt? }
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, category, images, stock, salePrice, promoEndsAt } = req.body;

    if (!title || typeof price !== "number") {
      return res
        .status(400)
        .json({ error: "title (string) et price (number) sont requis" });
    }

    const created = await Product.create({
      title: String(title),
      description: description ? String(description) : undefined,
      price: Number(price),
      category: category ? String(category) : undefined,
      images: Array.isArray(images) ? images.map(String) : [],
      stock: typeof stock === "number" ? stock : 0,
      salePrice: typeof salePrice === "number" ? salePrice : undefined,
      promoEndsAt: promoEndsAt ? new Date(promoEndsAt) : undefined,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Create failed" });
  }
});

/**
 * PUT /api/products/:id
 * body: champs partiels possibles
 */
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const payload: any = {};
    const allowed = [
      "title",
      "description",
      "price",
      "salePrice",
      "promoEndsAt",
      "category",
      "images",
      "stock",
      "popularity",
      "compatibility",
    ];

    for (const k of allowed) {
      if (k in req.body) payload[k] = req.body[k];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("PUT /products/:id error:", err);
    res.status(400).json({ error: "Update failed" });
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
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
    const result = await seedProductsIfEmpty();
    res.json({
      ok: true,
      inserted: result.inserted,
      skipped: result.skipped,
      message: result.skipped ? "Database already has products" : "Seed inserted",
    });
  } catch (err) {
    console.error("SEED error:", err);
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
