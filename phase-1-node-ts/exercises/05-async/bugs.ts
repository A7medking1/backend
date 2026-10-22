const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function saveOrder(id: number): Promise<void> {
  await wait(50);
  if (id === 3) throw new Error(`order ${id} failed`);
  console.log("saved", id);
}

async function saveAll(ids: number[]): Promise<void> {
  // BUG 1: forEach(async) does not wait, so "all saved" printed before anything was saved
  // and any error escaped as an unhandled rejection.
  // FIX: Promise.all waits for all of them (they are independent, so run them together).
  await Promise.all(ids.map((id) => saveOrder(id)));
  console.log("all saved");
}

async function safeSave(id: number): Promise<string> {
  try {
    // BUG 2: returning the promise without await lets the rejection skip this catch.
    // FIX: return await, so the error is thrown inside the try.
    await saveOrder(id);
    return "ok";
  } catch {
    return "failed";
  }
}

async function main() {
  try {
    // BUG 3: no await, so try/catch could never catch an error from saveAll.
    // FIX: await it.
    await saveAll([1, 2]);
  } catch (e) {
    console.log("caught", e);
  }
  console.log(await safeSave(3));
}

await main();
