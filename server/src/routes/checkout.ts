import { Router } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import ProductModel from "../models/Product";
import Order from "../models/Order";
import { optionalAuth, AuthRequest } from "../middleware/auth";

dotenv.config();

const secret = process.env.STRIPE_SECRET;
if (!secret) {
  throw new Error("STRIPE_SECRET manquante dans server/.env");
}
const stripeUnavailable = secret.startsWith("sk_test_dummy");
const stripe = new Stripe(secret, { apiVersion: "2024-06-20" } as any);

const router = Router();

// POST /api/checkout
router.post("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "items est requis et doit etre une liste non vide" });
    }
    const address =
      typeof shippingAddress === "string" && shippingAddress.trim().length >= 5
        ? shippingAddress.trim()
        : undefined;
    if (!address) {
      return res.status(400).json({ error: "Adresse de livraison requise" });
    }

    const ids = items.map((it: any) => it.productId);
    const products = await ProductModel.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map((p) => [String(p._id), p]));

    const line_items = items.map((it: any) => {
      const p = map.get(String(it.productId));
      if (!p) throw new Error(`Produit introuvable: ${it.productId}`);
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

    const total = items.reduce((sum: number, it: any) => {
      const p = map.get(String(it.productId));
      if (!p) return sum;
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
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
      metadata: { shippingAddress: address },
    });

    if (req.user) {
      await Order.create({
        user: req.user._id,
        items: items.map((it: any) => {
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
        shippingAddress: address,
      });
    }

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error("[checkout] error:", err);
    if (err?.type && String(err.type).includes("Stripe")) {
      return res.status(400).json({ error: "Stripe a refuse la cle ou la requete. Verifiez STRIPE_SECRET." });
    }
    return res.status(500).json({ error: err?.message || "Erreur interne" });
  }
});

export default router;
