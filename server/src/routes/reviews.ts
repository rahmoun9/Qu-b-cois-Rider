import { Router } from "express";
import Review from "../models/Review";
import Product from "../models/Product";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });

// GET /api/products/:id/reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const avg =
      reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0;
    res.json({ items: reviews, average: avg, total: reviews.length });
  } catch (err) {
    console.error("GET /products/:id/reviews error", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/products/:id/reviews
router.post("/:id/reviews", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body || {};
    const rate = Number(rating);
    if (!Number.isFinite(rate) || rate < 1 || rate > 5) {
      return res.status(400).json({ error: "rating entre 1 et 5 requis" });
    }
    const exists = await Product.findById(req.params.id);
    if (!exists) return res.status(404).json({ error: "Produit introuvable" });
    const created = await Review.create({
      product: req.params.id,
      user: req.user!._id,
      rating: rate,
      comment: comment ? String(comment).slice(0, 500) : undefined,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("POST /products/:id/reviews error", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
