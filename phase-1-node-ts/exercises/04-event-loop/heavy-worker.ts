import { parentPort, workerData } from "node:worker_threads";

// Runs in its own thread, so the busy loop does not block the server
const end = Date.now() + (workerData as { ms: number }).ms;
while (Date.now() < end) {}
parentPort?.postMessage("slow done");
