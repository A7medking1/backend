import { readFile } from "node:fs/promises";
import { isOrderList, type Order, type OrderStatus } from "./order.js";

function hasCode(err: unknown, code: string): boolean {
  return err instanceof Error && "code" in err && err.code === code;
}

function printStats(orders: Order[]): void {
  const counted = orders.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((sum, o) => sum + o.total, 0);
  const average = counted.length > 0 ? revenue / counted.length : 0;

  const byStatus: Partial<Record<OrderStatus, number>> = {};
  const byCustomer = new Map<number, number>();
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    byCustomer.set(o.customerId, (byCustomer.get(o.customerId) ?? 0) + 1);
  }

  let topCustomer: number | null = null;
  let topCount = 0;
  for (const [customerId, count] of byCustomer) {
    if (count > topCount) {
      topCustomer = customerId;
      topCount = count;
    }
  }

  console.log(`orders:        ${orders.length}`);
  console.log(`revenue:       ${revenue} (cancelled excluded)`);
  console.log(`average order: ${average.toFixed(2)}`);
  console.log("by status:    ", byStatus);
  console.log(`top customer:  ${topCustomer ?? "-"} (${topCount} orders)`);
}

async function main(): Promise<void> {
  const [file] = process.argv.slice(2);
  if (!file) {
    console.error("usage: npx tsx stats.ts <orders.json>");
    process.exitCode = 1;
    return;
  }

  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (err) {
    console.error(hasCode(err, "ENOENT") ? `file not found: ${file}` : `cannot read ${file}`);
    process.exitCode = 1;
    return;
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`not valid JSON: ${file}`);
    process.exitCode = 1;
    return;
  }

  if (!isOrderList(data)) {
    console.error("JSON must be an array of orders: { id, customerId, status, total }");
    process.exitCode = 1;
    return;
  }

  printStats(data);
}

await main();
