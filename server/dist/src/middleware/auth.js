"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = exports.requireAdmin = exports.optionalAuth = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const requireAuth = async (req, res, next) => {
    try {
        const token = (req.headers.authorization || "").replace("Bearer ", "");
        if (!token)
            return res.status(401).json({ error: "Token manquant" });
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.default.findById(payload.id);
        if (!user)
            return res.status(401).json({ error: "Utilisateur invalide" });
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Non autorise" });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = async (req, _res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth)
            return next();
        const token = auth.replace("Bearer ", "");
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.default.findById(payload.id);
        if (user)
            req.user = user;
    }
    catch {
        // ignore invalid token silently for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: "Non autorise" });
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Admin requis" });
    next();
};
exports.requireAdmin = requireAdmin;
const signToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
};
exports.signToken = signToken;
