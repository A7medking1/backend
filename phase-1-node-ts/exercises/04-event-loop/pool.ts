import { pbkdf2 } from "node:crypto";

// libuv thread pool has 4 threads by default (UV_THREADPOOL_SIZE)
const COUNT = Number(process.argv[2] ?? 6);
const start = Date.now();

for (let i = 1; i <= COUNT; i++) {
  pbkdf2("pw", "salt", 300_000, 64, "sha512", () => {
    console.log(`hash ${i}: ${Date.now() - start}ms`);
  });
}
