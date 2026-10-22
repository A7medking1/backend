// Calls every route of server.ts. Run the server first, in another terminal.
const BASE = "http://localhost:3000";

async function call(method: string, path: string, body?: string): Promise<void> {
  const init: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) init.body = body;
  const res = await fetch(BASE + path, init);
  console.log(`${method} ${path} -> ${res.status} ${await res.text()}`);
}

await call("GET", "/health");
await call("GET", "/orders?status=delivered");
await call("GET", "/orders?status=done");
await call("POST", "/orders", JSON.stringify({ customerId: 13, total: 75 }));
await call("POST", "/orders", "oops");
await call("POST", "/orders", JSON.stringify({ customerId: "x", total: 75 }));
await call("POST", "/orders", JSON.stringify({ customerId: 13, total: 0 }));
await call("GET", "/nothing");
