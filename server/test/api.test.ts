import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app";
import { seedProductsIfEmpty } from "../src/data/seedProducts";

dotenv.config();

let server: any;
let baseUrl = "";

before(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quebecois-rider-test";
  await mongoose.connect(uri);
  await seedProductsIfEmpty();

  server = app.listen(0);
  const address = server.address();
  const port = typeof address === "string" ? 0 : address?.port;
  baseUrl = `http://localhost:${port}`;
});

after(async () => {
  await mongoose.disconnect();
  if (server) {
    server.close();
  }
});

test("GET /api/products returns a non-empty array", async () => {
  const res = await fetch(`${baseUrl}/api/products`);
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(Array.isArray(data.items));
  assert.ok(data.items.length >= 1);
});

test("POST /api/checkout validates body", async () => {
  const res = await fetch(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [] }),
  });
  assert.equal(res.status, 400);
});
