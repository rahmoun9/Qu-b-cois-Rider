"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: "email et password requis" });
        const exists = await User_1.default.findOne({ email: String(email).toLowerCase().trim() });
        if (exists)
            return res.status(409).json({ error: "Email deja utilise" });
        const user = await User_1.default.create({
            email: String(email).toLowerCase().trim(),
            password: String(password),
            name: name ? String(name) : undefined,
        });
        const token = (0, auth_1.signToken)(user);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (err) {
        console.error("register error", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: "email et password requis" });
        const user = await User_1.default.findOne({ email: String(email).toLowerCase().trim() });
        if (!user)
            return res.status(401).json({ error: "Identifiants invalides" });
        const match = await user.comparePassword(String(password));
        if (!match)
            return res.status(401).json({ error: "Identifiants invalides" });
        const token = (0, auth_1.signToken)(user);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (err) {
        console.error("login error", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
router.get("/me", auth_1.requireAuth, (req, res) => {
    const user = req.user;
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});
exports.default = router;
