const wait = <T>(ms: number, value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  // clear the timer when done, so it does not keep the process alive for nothing
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function check(ms: number): Promise<void> {
  try {
    const value = await withTimeout(wait(100, "data"), ms);
    console.log(`timeout ${ms}ms -> ${value}`);
  } catch (err) {
    if (err instanceof Error) console.log(`timeout ${ms}ms -> error: ${err.message}`);
  }
}

await check(300);
await check(50);
