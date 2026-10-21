import http from "node:http";

const PORT = 3999;

// Busy loop: keeps the main thread (the only JS thread) busy for `ms`
function blockFor(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const server = http.createServer((req, res) => {
  if (req.url === "/slow") {
    blockFor(5000);
    res.end("slow done\n");
    return;
  }
  if (req.url === "/fast") {
    res.end("fast\n");
    return;
  }
  res.statusCode = 404;
  res.end("not found\n");
});

server.listen(PORT, () => console.log(`blocking server on http://localhost:${PORT}`));
