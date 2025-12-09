"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const seedProducts_1 = require("./data/seedProducts");
dotenv_1.default.config();
async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI missing in server/.env");
    }
    await mongoose_1.default.connect(uri);
    try {
        const result = await (0, seedProducts_1.seedProductsIfEmpty)();
        if (result.skipped) {
            console.log("Seed skipped: database already has products.");
        }
        else {
            console.log(`Seed inserted ${result.inserted} products.`);
        }
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
run().catch((err) => {
    console.error("[seed] error:", err);
    process.exit(1);
});
