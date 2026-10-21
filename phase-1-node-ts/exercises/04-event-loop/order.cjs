// Same puzzle as CommonJS: here nextTick runs before promises
console.log("A sync start");
setTimeout(() => console.log("B setTimeout 0"), 0);
setImmediate(() => console.log("C setImmediate"));
Promise.resolve().then(() => console.log("D promise.then"));
queueMicrotask(() => console.log("E queueMicrotask"));
process.nextTick(() => console.log("F nextTick"));
console.log("G sync end");
