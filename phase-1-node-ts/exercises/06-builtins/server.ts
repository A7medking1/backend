import http from "node:http";
import path from "node:path";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import { isOrderList, isStatus, type Order } from "./order.js";

const PORT = 3000;
// Built from the file's own folder, so it works no matter where you run the command from
const ORDERS_FILE = path.join(import.meta.dirname, "data", "orders.json");
const LOG_FILE = path.join(import.meta.dirname, "data", "orders.log");

// ---------- events ----------
const bus = new EventEmitter<{ "order:created": [Order] }>();

bus.on("order:created", async (order) => {
  // emit does not wait for this async listener, so errors must be caught here
  try {
    await appendFile(LOG_FILE, `${new Date().toISOString()} order ${order.id} created\n`);
  } catch (err) {
    console.error("failed to write log", err);
  }
});

// ---------- data ----------
async function readOrders(): Promise<Order[]> {
  const data: unknown = JSON.parse(await readFile(ORDERS_FILE, "utf8"));
  if (!isOrderList(data)) throw new Error("orders.json is corrupted");
  return data;
}

async function writeOrders(orders: Order[]): Promise<void> {
  await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ---------- http helpers ----------
function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}

// Returns an error message, or null when the body is valid
function validateNewOrder(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return "body must be a JSON object";
  const b = body as Record<string, unknown>;
  if (typeof b.customerId !== "number") return "customerId must be a number";
  if (typeof b.total !== "number") return "total must be a number";
  if (b.total <= 0) return "total must be greater than 0";
  return null;
}

// ---------- routes ----------
async function getOrders(url: URL, res: http.ServerResponse): Promise<void> {
  const status = url.searchParams.get("status");
  if (status !== null && !isStatus(status)) {
    return sendJson(res, 400, { error: `unknown status: ${status}` });
  }
  const orders = await readOrders();
  sendJson(res, 200, status ? orders.filter((o) => o.status === status) : orders);
}

async function createOrder(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let body: unknown;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { error: "invalid JSON" });
  }

  const error = validateNewOrder(body);
  if (error) return sendJson(res, 400, { error });
  const { customerId, total } = body as { customerId: number; total: number };

  const orders = await readOrders();
  const id = orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
  const order: Order = { id, customerId, total, status: "pending" };
  orders.push(order);
  await writeOrders(orders);

  bus.emit("order:created", order);
  sendJson(res, 201, order);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  try {
    if (req.method === "GET" && url.pathname === "/health") return sendJson(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/orders") return await getOrders(url, res);
    if (req.method === "POST" && url.pathname === "/orders") return await createOrder(req, res);
    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    // anything unexpected (corrupted file, disk error) becomes a 500 instead of crashing the server
    console.error(err);
    sendJson(res, 500, { error: "internal server error" });
  }
});

server.listen(PORT, () => console.log(`orders server on http://localhost:${PORT}`));
