import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedProductsIfEmpty } from "./data/seedProducts";

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing in server/.env");
  }

  await mongoose.connect(uri);
  try {
    const result = await seedProductsIfEmpty();
    if (result.skipped) {
      console.log("Seed skipped: database already has products.");
    } else {
      console.log(`Seed inserted ${result.inserted} products.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("[seed] error:", err);
  process.exit(1);
});
