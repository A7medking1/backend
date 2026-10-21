import http from "node:http";
import { Worker } from "node:worker_threads";

const PORT = 3999;

function runHeavy(ms: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./heavy-worker.ts", import.meta.url), {
      workerData: { ms },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/slow") {
    const result = await runHeavy(5000);
    res.end(result + "\n");
    return;
  }
  if (req.url === "/fast") {
    res.end("fast\n");
    return;
  }
  res.statusCode = 404;
  res.end("not found\n");
});

server.listen(PORT, () => console.log(`fixed server on http://localhost:${PORT}`));
