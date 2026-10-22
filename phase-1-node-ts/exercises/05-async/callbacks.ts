import { promisify } from "node:util";

interface User {
  id: number;
  name: string;
}

// Old callback-style API (error-first)
function getUserCb(id: number, cb: (err: Error | null, user?: User) => void): void {
  setTimeout(() => {
    if (id <= 0) cb(new Error("invalid id"));
    else cb(null, { id, name: `user${id}` });
  }, 100);
}

// 1) By hand: err -> reject, result -> resolve
function getUser(id: number): Promise<User> {
  return new Promise((resolve, reject) => {
    getUserCb(id, (err, user) => {
      if (err) reject(err);
      else resolve(user!); // no error means user is set
    });
  });
}

// 2) promisify does the same wrapping for any error-first function
const getUserP = promisify(getUserCb);

async function tryGet(label: string, fn: () => Promise<User | undefined>): Promise<void> {
  try {
    const user = await fn();
    console.log(`${label}: ok`, user);
  } catch (err) {
    if (err instanceof Error) console.log(`${label}: failed -> ${err.message}`);
  }
}

await tryGet("manual id=1", () => getUser(1));
await tryGet("manual id=0", () => getUser(0));
await tryGet("promisify id=1", () => getUserP(1));
await tryGet("promisify id=0", () => getUserP(0));
