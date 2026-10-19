# الدرس 01 — تجهيز المشروع وأساسيات JavaScript

> **الهدف:** تجهّز أول مشروع TypeScript وتشغّله، وتفهم الحاجات اللي في JS **مختلفة** عن Dart.
> **الوقت المتوقع:** ساعة ونص – ساعتين.

---

## الجزء 1: تجهيز المشروع

افتح Terminal في فولدر `D:\backend\phase-1-node-ts` واكتب الأوامر دي **بإيدك** واحد واحد:

```bash
npm init -y
```
> بيعمل `package.json` — زي `pubspec.yaml` في Flutter بالظبط: اسم المشروع، الـscripts، والـpackages.

```bash
npm install -D typescript tsx @types/node
```
> - `typescript`: الـcompiler بتاع TS.
> - `tsx`: بيشغّل ملفات `.ts` على طول من غير ما تعمل build (زي `dart run`).
> - `@types/node`: الـtypes بتاعة Node عشان الـautocomplete يشتغل.
> - `-D` يعني **devDependency**: حاجة محتاجها وأنت بتطوّر بس، مش في الـproduction (زي `dev_dependencies` في pubspec).

```bash
npx tsc --init
npm pkg set type=module
```
> - الأول بيعمل `tsconfig.json` (إعدادات TypeScript — زي `analysis_options.yaml` تقريبًا).
> - التاني بيقول لـNode إن المشروع بيستخدم `import/export` الحديثة. هنفهم ده بالتفصيل في الدرس 03.

لاحظ إن فولدر `node_modules` اتعمل — ده مكان الـpackages (زي `.dart_tool` / pub cache). **عمره ما بيترفع على Git.**

### جرّب إنه شغال
اعمل ملف `exercises/hello.ts` واكتب فيه:
```ts
const name: string = "Said";
console.log(`Hello ${name} from Node ${process.version}`);
```
وشغّله:
```bash
npx tsx exercises/hello.ts
```
لو طبعلك الجملة — مبروك، أول سطر Node 🎉

---

## الجزء 2: أساسيات JS اللي مختلفة عن Dart

### 1) `let` / `const` (وانسى `var`)
| Dart | JS/TS | المعنى |
| --- | --- | --- |
| `var x = 1;` / `int x = 1;` | `let x = 1;` | متغير ينفع يتغير |
| `final x = 1;` | `const x = 1;` | مينفعش تعيد تعيينه |
| `const x = 1;` | مفيش مقابل مباشر | compile-time constant |

⚠️ `const` في JS زي `final` في Dart: **المرجع** ثابت، بس المحتوى ممكن يتغير:
```ts
const list = [1, 2];
list.push(3);     // ✅ عادي
// list = [];     // ❌ خطأ
```
**القاعدة:** استخدم `const` دايمًا، و`let` بس لو هتغيّر القيمة. `var` قديمة ومتستخدمهاش.

### 2) Arrow functions
```ts
// Dart:  int add(int a, int b) => a + b;
const add = (a: number, b: number): number => a + b;

// أكتر من سطر
const greet = (name: string) => {
  const msg = `Hi ${name}`;   // ده template string — زي '$name' في Dart بس بـ backtick و ${}
  return msg;
};
```

### 3) Destructuring (فكّ الـobject أو الـarray)
```ts
const user = { name: "Ali", age: 25, city: "Cairo" };

const { name, age } = user;              // name = "Ali", age = 25
const { city: userCity } = user;         // rename: userCity = "Cairo"
const { phone = "N/A" } = user as any;   // default value لو مش موجود

const [first, second] = [10, 20, 30];    // first = 10, second = 20
```
> قريب من الـpatterns في Dart 3: `final (a, b) = record;`

### 4) Spread `...`
```ts
const a = [1, 2];
const b = [...a, 3];                        // [1, 2, 3]  — زي [...a, 3] في Dart بالظبط

const base = { name: "Ali", age: 25 };
const updated = { ...base, age: 26 };       // نسخة جديدة والـage اتغير — زي copyWith
```

### 5) Optional chaining `?.` و `??`
نفس Dart تقريبًا:
```ts
const order = { customer: { address: null as string | null } };
const addr = order.customer?.address ?? "No address";
```

### 6) `==` vs `===` ⚠️ (مفيش زيه في Dart)
`==` في JS بيعمل **تحويل نوع** قبل المقارنة، وده بيجيب نتايج غريبة:
```ts
0 == "0"          // true  😱
0 == ""           // true  😱
null == undefined // true
0 === "0"         // false ✅
```
**القاعدة:** استخدم `===` و `!==` **دايمًا**.

### 7) `null` vs `undefined` (Dart عنده `null` بس)
| | معناه |
| --- | --- |
| `undefined` | "مفيش قيمة اتحطت أصلًا" — متغير متعرّفش، property مش موجودة، function مارجعتش حاجة |
| `null` | "أنا قاصد إن مفيش قيمة" |

```ts
let x;                 // undefined
const obj = { a: 1 };
obj.b;                 // undefined (في TS هيطلعلك error — وده كويس)
const y = null;        // null
```
> في الـAPIs هتشوف الاتنين. الـ`??` و `?.` بيتعاملوا مع الاتنين.

### 8) Truthy / Falsy (ودي كمان مش في Dart)
في Dart الـ`if` لازم ياخد `bool`. في JS أي قيمة تنفع، والقيم دي بتتحسب **false**:
`false`, `0`, `""`, `null`, `undefined`, `NaN`

```ts
const count = 0;
if (count) { /* مش هيدخل هنا! */ }
const c1 = count || 10;   // 10   ⚠️ عشان 0 falsy
const c2 = count ?? 10;   // 0    ✅ ?? بيبص على null/undefined بس
```

---

## ✍️ التمرين (بإيدك — من غير AI)

اعمل ملف `exercises/01-basics.ts` واكتب فيه:

1. `const` فيه array من 4 منتجات، كل منتج `{ id, name, price, category, discount }` — خلّي واحد منهم `discount: null` وواحد `discount: 0`.
2. arrow function اسمها `finalPrice` تاخد منتج وترجع السعر بعد الخصم. لازم تتعامل صح مع `null` **و** `0` (فكّر: `||` ولا `??`؟).
3. استخدم destructuring عشان تطبع `name` و `price` لأول منتج.
4. اعمل نسخة من تاني منتج بسعر جديد باستخدام spread، واتأكد إن الأصلي **ماتغيرش**.
5. اطبع نتيجة `1 == "1"` و `1 === "1"` و `null == undefined` و `null === undefined`، واكتب كومنت جنب كل واحدة بتفسيرك.
6. بونص: استخدم `.filter()` و `.map()` (زي `.where()` و `.map()` في Dart) عشان تطبع أسماء المنتجات اللي سعرها النهائي أكبر من 100.

شغّل:
```bash
npx tsx exercises/01-basics.ts
```

لما تخلّص، قول للـAgent **"راجع تمرين 01"** وهو هيراجعه من غير ما يكتبهولك من الأول.

---

## ❓ أسئلة مراجعة (جاوب عليها للـAgent قبل ما تنتقل للدرس 02)
1. إيه الفرق بين `const` في JS و `const` في Dart؟
2. ليه `0 == ""` بترجع `true`؟ وإيه اللي تستخدمه بدلها؟
3. إمتى تستخدم `??` بدل `||`؟ اديني مثال يفرق فيه.
4. إيه الفرق بين `null` و `undefined`؟
5. `{ ...user, age: 30 }` بتعدّل `user` الأصلي ولا لأ؟

---

## 📚 مصادر لو حابب تتعمق
- [MDN — JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) (أحسن مرجع للـJS)
- [TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
