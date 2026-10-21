import type { Order, UpdateOrder } from "./types.js";
import { orderTotal, canMoveTo, parseStatus } from "./orders.js";
import ok from "./response.js";

const order: Order = {
  id: 1,
  customerId: 10,
  items: [
    { productId: 100, quantity: 2, unitPrice: 50 },
    { productId: 200, quantity: 1, unitPrice: 30 },
  ],
  status: "pending",
  createdAt: new Date(),
};

console.log("total:", orderTotal(order));
console.log("pending -> accepted:", canMoveTo("pending", "accepted"));
console.log("picked -> cancelled:", canMoveTo("picked", "cancelled"));
console.log(ok(order.id));
console.log(ok(order.id, "created"));
const update: UpdateOrder = { status: "accepted", note: "ring the bell" };
console.log(update);
console.log(parseStatus("accepted"), parseStatus("done"), parseStatus(42), parseStatus(null));
