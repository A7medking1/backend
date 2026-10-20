// exercises/01-basics.ts

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  discount: number | null; // نسبة مئوية (10 = 10%)
};

// 1) array فيها 4 منتجات — واحد discount: null وواحد discount: 0
const products: Product[] = [
  { id: 1, name: "Laptop", price: 1500, category: "electronics", discount: 10 },
  { id: 2, name: "Mouse", price: 80, category: "electronics", discount: null },
  { id: 3, name: "Shirt", price: 120, category: "clothes", discount: 0 },
  { id: 4, name: "Book", price: 150, category: "books", discount: 50 },
];

// 2) finalPrice — ?? عشان الـ0 يفضل 0 والـnull بس هو اللي ياخد الـdefault
const finalPrice = (p: Product): number => {
  const discount = p.discount ?? 0;
  return p.price - (p.price * discount) / 100;
};

console.log("--- finalPrice ---");
products.forEach((p) => console.log(p.name, finalPrice(p)));

// 3) destructuring لأول منتج
// الـ! لأن noUncheckedIndexedAccess شغال في tsconfig فـproducts[0] نوعه Product | undefined
const { name, price } = products[0]!;
console.log("--- destructuring ---");
console.log(name, price); // Laptop 1500

// 4) نسخة من تاني منتج بسعر جديد — الأصلي مايتغيرش
const second = products[1]!;
const updated = { ...second, price: 100 };
console.log("--- spread ---");
console.log("original:", second.price); // 80
console.log("updated:", updated.price); // 100

// 5) == vs ===
console.log("--- equality ---");
// @ts-expect-error — TS بيمنع مقارنة number بـstring، وده كويس
console.log(1 == "1"); // true  → "1" اتحولت لـ1 قبل المقارنة (coercion)
// @ts-expect-error
console.log(1 === "1"); // false → number ≠ string، مفيش تحويل
console.log(null == undefined); // true  → الاستثناء الخاص بـ== في JS
console.log(null === undefined); // false → نوعين مختلفين

// 6) بونص: أسماء المنتجات اللي سعرها النهائي > 100
const expensive = products
  .filter((p) => finalPrice(p) > 100)
  .map((p) => p.name);
console.log("--- bonus ---");
console.log(expensive); // [ 'Laptop', 'Shirt' ]