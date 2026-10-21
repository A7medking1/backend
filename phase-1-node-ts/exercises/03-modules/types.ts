export type OrderStatus = "pending" | "accepted" | "picked" | "delivered" | "cancelled";

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  customerId: number;
  items: OrderItem[];
  status: OrderStatus;
  note?: string;
  readonly createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type UpdateOrder = Partial<Omit<Order, "id" | "createdAt">>;
