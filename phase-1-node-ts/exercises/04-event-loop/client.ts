// Sends /slow, then /fast 100ms later, and prints how long /fast waited.
// Run it while one of the servers is running (in another terminal).
const BASE = "http://localhost:3999";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const start = Date.now();
const slow = fetch(`${BASE}/slow`).then((r) => r.text());
await wait(100);

const fastStart = Date.now();
await fetch(`${BASE}/fast`);
console.log(`/fast waited ${Date.now() - fastStart} ms`);

await slow;
console.log(`/slow total ${Date.now() - start} ms`);
