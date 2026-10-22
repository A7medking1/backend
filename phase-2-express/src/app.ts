import express from "express";
import { ordersRouter } from "./orders.router.js";
import { logger } from "./middlewares/logger.js";

const app = express();
app.use(express.json());
app.use(logger);
app.use("/api/v1/orders", ordersRouter);

app.get("/health", (req, res) => {
    res.json({ ok: true, data: {} });
});

app.use((req, res) => {
    res.status(404).json({ ok: false, error: "not found" });
});



app.listen(3000, () => console.log("http://localhost:3000"));


