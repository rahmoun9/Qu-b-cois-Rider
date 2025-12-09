import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import productsRouter from "./routes/products";
import checkoutRouter from "./routes/checkout";
import configRouter from "./routes/config";
import authRouter from "./routes/auth";
import ordersRouter from "./routes/orders";
import reviewsRouter from "./routes/reviews";

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";

app.get("/", (_req, res) => {
  res.send("API Quebecois Rider OK. Essayez /api/products");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false,
  })
);
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/products", productsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/config", configRouter);
app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/products", reviewsRouter);

export default app;
