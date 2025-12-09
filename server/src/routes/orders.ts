import { Router } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items requis" });
    }
    const address =
      typeof shippingAddress === "string" && shippingAddress.trim().length >= 5
        ? shippingAddress.trim()
        : undefined;
    if (!address) {
      return res.status(400).json({ error: "Adresse de livraison requise" });
    }
    const ids = items.map((it: any) => it.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = items.map((it: any) => {
      const p = map.get(String(it.productId));
      if (!p) throw new Error(`Produit introuvable: ${it.productId}`);
      const now = Date.now();
      const end = p.promoEndsAt ? new Date(p.promoEndsAt).getTime() : null;
      const promo = typeof p.salePrice === "number" && p.salePrice > 0 && p.salePrice < p.price && (!end || end > now);
      const priceUsed = promo ? p.salePrice : p.price;
      return {
        product: it.productId,
        title: p.title,
        price: Number(priceUsed),
        qty: Math.max(1, Number(it.qty) || 1),
      };
    });

    const total = orderItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    // estimée par défaut à +5 jours
    const eta = new Date();
    eta.setDate(eta.getDate() + 5);

    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      total,
      status: "pending",
      shippingAddress: address,
      estimatedDelivery: eta,
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error("POST /orders error", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

// Annuler une commande (user propriétaire ou admin)
router.put("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!reason) return res.status(400).json({ error: "Motif d'annulation requis" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Commande introuvable" });
    const isOwner = String(order.user) === String(req.user!._id);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Non autorise" });
    if (order.status === "canceled") {
      return res.status(400).json({ error: "Commande deja annulee" });
    }
    order.status = "canceled";
    order.canceledAt = new Date();
    order.cancelReason = reason;
    await order.save();
    res.json(order);
  } catch (err: any) {
    console.error("PUT /orders/:id/cancel error", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

export default router;
