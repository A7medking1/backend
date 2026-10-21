import type { Order, OrderStatus } from "./types.js";

// private: not exported, so only this file can use it
const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked", "cancelled"],
  picked: ["delivered"],
  delivered: [],
  cancelled: [],
};

const allStatuses: OrderStatus[] = ["pending", "accepted", "picked", "delivered", "cancelled"];

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function canMoveTo(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function parseStatus(input: unknown): OrderStatus | null {
  if (typeof input !== "string") return null;
  return allStatuses.find((s) => s === input) ?? null;
}
