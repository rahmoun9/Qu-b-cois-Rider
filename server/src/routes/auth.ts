import { Router } from "express";
import User from "../models/User";
import { requireAuth, signToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email et password requis" });
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Email deja utilise" });
    const user = await User.create({
      email: String(email).toLowerCase().trim(),
      password: String(password),
      name: name ? String(name) : undefined,
    });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email et password requis" });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Identifiants invalides" });
    const match = await user.comparePassword(String(password));
    if (!match) return res.status(401).json({ error: "Identifiants invalides" });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

export default router;
