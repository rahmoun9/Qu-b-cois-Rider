"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    const secret = process.env.STRIPE_SECRET || "";
    const stripeEnabled = !!secret && !secret.startsWith("sk_test_dummy");
    res.json({
        stripeEnabled,
        paymentMethods: stripeEnabled ? ["card", "cod"] : ["cod"],
    });
});
exports.default = router;
