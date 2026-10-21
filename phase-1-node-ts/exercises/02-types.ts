type OrderStatus = "pending" | "accepted" | "picked" | "delivered" | "cancelled";

interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  customerId: number;
  items: OrderItem[];
  status: OrderStatus;
  note?: string;
  readonly createdAt: Date;
}

function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked", "cancelled"],
  picked: ["delivered"],
  delivered: [],
  cancelled: [],
};

function canMoveTo(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function ok<T>(data: T, message?: string): ApiResponse<T> {
  if (message === undefined) {
    return { success: true, data };
  }
  return { success: true, data, message };
}

type UpdateOrder = Partial<Omit<Order, "id" | "createdAt">>;

const allStatuses: OrderStatus[] = ["pending", "accepted", "picked", "delivered", "cancelled"];

function parseStatus(input: unknown): OrderStatus | null {
  if (typeof input !== "string") return null;
  return allStatuses.find((s) => s === input) ?? null;
}

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
