const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, times: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn(); // return await so a failure is caught here
    } catch (err) {
      lastError = err;
      console.log(`attempt ${attempt} failed`);
      if (attempt < times) await wait(100);
    }
  }
  throw lastError;
}

// Fails the first 2 calls, succeeds on the 3rd
let calls = 0;
async function flaky(): Promise<string> {
  calls++;
  if (calls < 3) throw new Error(`call ${calls} failed`);
  return `succeeded on call ${calls}`;
}

console.log(await retry(flaky, 3));

calls = 0;
try {
  await retry(flaky, 2);
} catch (err) {
  if (err instanceof Error) console.log("gave up:", err.message);
}
