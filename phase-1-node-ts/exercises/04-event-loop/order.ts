// Prediction (ESM):
// A sync start, G sync end        <- sync code always first
// D promise.then, E queueMicrotask <- microtasks (in ESM the module runs inside a microtask,
// F nextTick                        so promises created here drain before nextTick)
// B setTimeout 0 / C setImmediate  <- order between these two is random at top level

console.log("A sync start");
setTimeout(() => console.log("B setTimeout 0"), 0);
setImmediate(() => console.log("C setImmediate"));
Promise.resolve().then(() => console.log("D promise.then"));
queueMicrotask(() => console.log("E queueMicrotask"));
process.nextTick(() => console.log("F nextTick"));
console.log("G sync end");
