const name: string = "Said";
console.log(`Hello ${name} from Node ${process.version}`);

const finalPrice = 0
const discount = null

console.log(finalPrice || 10); // 10
console.log(finalPrice ?? 10); // 0

console.log(discount || 20); // 20
console.log(discount ?? 20); // 20
