import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import { seedProductsIfEmpty } from "./data/seedProducts";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI manquant dans server/.env");
}

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      const seed = await seedProductsIfEmpty();
      if (seed.skipped) {
        console.log("[seed] Database already has products, skipping auto-seed.");
      } else {
        console.log(`[seed] Inserted ${seed.inserted} demo products.`);
      }
    } catch (err) {
      console.error("[seed] Auto-seed failed:", err);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
