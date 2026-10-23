import { Router } from "express";
import { requireApiKey } from "./middlewares/require-api-key.js";


const orders = [
    { id: 1, customerId: 10, status: "delivered", total: 250 },
    { id: 2, customerId: 11, status: "pending", total: 120 },
];

export const ordersRouter = Router();


ordersRouter.get("/", (req, res) => {
    const { status } = req.query;
    if (status !== undefined && typeof status !== "string") {
        return res.status(400).json({ ok: false, error: "status must be a single value" });
    }
    const result = status
        ? orders.filter((o) => o.status === status)
        : orders;

    res.json({ ok: true, data: result });
});

ordersRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ ok: false, error: "id must be a number" });
    }

    const order = orders.find((o) => o.id === id);

    if (!order) {
        return res.status(404).json({ ok: false, error: "Order not found" });
    }

    res.json({ ok: true, data: order });
});

ordersRouter.post("/", requireApiKey, (req, res) => {
    const { customerId, total } = req.body ?? {};


    if (!Number.isInteger(customerId)) {
        return res.status(400).json({ ok: false, error: "customerId must be a number" });
    }


    if (!Number.isFinite(total)) {
        return res.status(400).json({ ok: false, error: "total must be a number" });
    }

    if (total <= 0) {
        return res.status(422).json({ ok: false, error: "total must be greater than 0" });
    }

    const order = {
        id: orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1,
        customerId,
        status: "pending",
        total,
    };

    orders.push(order);

    res.status(201).location(`/api/v1/orders/${order.id}`).json({ ok: true, data: order });
});