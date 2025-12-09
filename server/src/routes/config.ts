import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  const secret = process.env.STRIPE_SECRET || "";
  const stripeEnabled = !!secret && !secret.startsWith("sk_test_dummy");
  res.json({
    stripeEnabled,
    paymentMethods: stripeEnabled ? ["card", "cod"] : ["cod"],
  });
});

export default router;
