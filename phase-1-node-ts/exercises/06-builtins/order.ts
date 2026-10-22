export type OrderStatus = "pending" | "accepted" | "picked" | "delivered" | "cancelled";

export interface Order {
  id: number;
  customerId: number;
  status: OrderStatus;
  total: number;
}

const STATUSES: OrderStatus[] = ["pending", "accepted", "picked", "delivered", "cancelled"];

export function isStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && STATUSES.some((s) => s === value);
}

// Type guard: checks the shape of data that came from outside (file, request body)
export function isOrder(value: unknown): value is Order {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.customerId === "number" &&
    typeof o.total === "number" &&
    isStatus(o.status)
  );
}

export function isOrderList(value: unknown): value is Order[] {
  return Array.isArray(value) && value.every(isOrder);
}
