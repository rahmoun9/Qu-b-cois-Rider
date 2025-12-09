"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("../src/app"));
const seedProducts_1 = require("../src/data/seedProducts");
dotenv_1.default.config();
let server;
let baseUrl = "";
(0, node_test_1.beforeAll)(async () => {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quebecois-rider-test";
    await mongoose_1.default.connect(uri);
    await (0, seedProducts_1.seedProductsIfEmpty)();
    server = app_1.default.listen(0);
    const address = server.address();
    const port = typeof address === "string" ? 0 : address?.port;
    baseUrl = `http://localhost:${port}`;
});
(0, node_test_1.afterAll)(async () => {
    await mongoose_1.default.disconnect();
    if (server) {
        server.close();
    }
});
(0, node_test_1.test)("GET /api/products returns a non-empty array", async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    strict_1.default.equal(res.status, 200);
    const data = (await res.json());
    strict_1.default.ok(Array.isArray(data));
    strict_1.default.ok(data.length >= 1);
});
(0, node_test_1.test)("POST /api/checkout validates body", async () => {
    const res = await fetch(`${baseUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
    });
    strict_1.default.equal(res.status, 400);
});
