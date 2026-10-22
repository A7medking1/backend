# الدرس 02 — TypeScript: الـTypes اللي هتستخدمها كل يوم

> **الهدف:** تعرف توصف شكل الداتا في الـbackend (users، orders، API responses) بـTypeScript، وتخلّي الـcompiler يمسكلك الأخطاء قبل الـproduction.
> **الوقت المتوقع:** ساعة ونص – ساعتين.
> **خبر حلو:** Dart عندك type system قوي، فمعظم الأفكار هنا هتبقى مألوفة. ركّز على الحاجات اللي **مالهاش مقابل** في Dart: union types، literal types، و`unknown`.

---

## 1) الأنواع الأساسية والـinference

| Dart | TypeScript |
| --- | --- |
| `int` / `double` | `number` (نوع واحد بس للاتنين) |
| `String` | `string` (حرف صغير) |
| `bool` | `boolean` |
| `List<int>` | `number[]` أو `Array<number>` |
| `Map<String, int>` | `Record<string, number>` |
| `dynamic` | `any` ⚠️ |
| `Object?` | `unknown` ✅ |
| `void` | `void` |

```ts
const age = 25;              // TS عرف لوحده إنها number (inference) — زي var في Dart
let price: number = 99.5;    // ممكن تكتب النوع صريح
const tags: string[] = ["new", "sale"];
```
**القاعدة:** سيب TS يستنتج النوع في المتغيرات، واكتبه **صريح** في parameters و return type بتوع الـfunctions.

---

## 2) `type` و `interface` — توصف شكل object

```ts
interface User {
  id: string;
  name: string;
  phone?: string;            // optional — زي String? بس الـproperty نفسها ممكن متبقاش موجودة
  readonly createdAt: Date;  // زي final field
}

type Product = {
  id: string;
  title: string;
  price: number;
};
```
- الاتنين تقريبًا نفس الحاجة للـobjects. **اختار واحد وامشي عليه** (أغلب مشاريع Express بتستخدم `interface` للـobjects و`type` للباقي).
- `type` بس هو اللي ينفع مع الـunions (هنشوفها تحت).

> ⚠️ **في الـtsconfig بتاعك `exactOptionalPropertyTypes` شغال.** يعني `phone?: string` معناها "يا موجودة وفيها string، يا مش موجودة خالص". مينفعش تكتب `phone: undefined` صريح. لو عايز تسمح بده، اكتب `phone?: string | undefined`.

### الفرق الكبير عن Dart: TS بيبص على **الشكل** مش **الاسم**
```ts
interface Point { x: number; y: number }
const p = { x: 1, y: 2 };       // ماعملتش new Point ولا حاجة
const q: Point = p;             // ✅ عادي — الشكل مطابق
```
في Dart لازم يكون instance من الـclass. في TS أي object شكله مطابق ينفع (اسمها **structural typing**). وده بالظبط اللي هتعيشه في الـbackend: الداتا بتيجي JSON عادي، مش objects من classes.

---

## 3) Union types — مفيش زيها في Dart ⭐

متغير ممكن يبقى **نوع من كذا نوع**:
```ts
let id: string | number;
id = "abc";   // ✅
id = 42;      // ✅
```

### Literal types — أقوى استخدام
بدل `string` عام، تحدد **القيم المسموحة بالظبط**:
```ts
type OrderStatus = "pending" | "accepted" | "picked" | "delivered";
type Role = "user" | "driver" | "merchant" | "admin";

let status: OrderStatus = "pending";
status = "delivred";   // ❌ error — الـtypo اتمسك في الـcompile time
```
ده هتستخدمه في الـcapstone لحالات الأوردر والـroles.

### Narrowing — TS بيفهم النوع من الـif
```ts
function format(id: string | number): string {
  if (typeof id === "string") {
    return id.toUpperCase();   // هنا TS عارف إنها string
  }
  return id.toFixed(0);        // وهنا عارف إنها number
}
```

### Discriminated unions — زي `sealed class` + `switch` في Dart 3
```ts
type Result =
  | { ok: true; data: User }
  | { ok: false; error: string };

function handle(r: Result) {
  if (r.ok) {
    console.log(r.data.name);   // TS عارف إن data موجودة
  } else {
    console.log(r.error);       // وهنا عارف إن error موجودة
  }
}
```

---

## 4) Generics — نفس Dart تقريبًا

```ts
// Dart: class ApiResponse<T> { final bool success; final T data; ... }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const res: ApiResponse<User[]> = { success: true, data: [], message: "ok" };

// generic function
function first<T>(items: T[]): T | undefined {
  return items[0];
}
const n = first([1, 2, 3]);    // n: number | undefined
```
> الـ`ApiResponse<T>` ده هو بالظبط الـ"unified response shape" اللي في الخطة (`{ success, data, message }`).

---

## 5) Enums — موجودة، بس غالبًا مش محتاجها

```ts
enum Role { User = "user", Admin = "admin" }
const r: Role = Role.Admin;
```
الـenums في TS بتتحول لكود JS حقيقي ولها مشاكل صغيرة. أغلب المشاريع الحديثة بتستخدم **literal union** بدلها:
```ts
type Role = "user" | "admin";            // أبسط وكفاية في 90% من الحالات

// ولو محتاج القيم كـ array كمان (مثلًا للـvalidation):
const ROLES = ["user", "admin"] as const;
type Role2 = (typeof ROLES)[number];      // "user" | "admin"
```
**هتشوف الاتنين في كود الشركة**، فلازم تعرف تقراهم.

---

## 6) `any` vs `unknown` ⚠️ مهم جدًا للـbackend

```ts
let a: any = JSON.parse(body);
a.foo.bar.baz();        // TS ساكت تمامًا — وهيضرب وقت التشغيل 💥

let u: unknown = JSON.parse(body);
u.foo;                  // ❌ error — لازم تتأكد من النوع الأول
if (typeof u === "object" && u !== null && "foo" in u) {
  // هنا بس تقدر تستخدمه
}
```
- `any` = بتطفي TS. **ممنوعة في المشروع** (قاعدة في الخطة).
- `unknown` = "مش عارف النوع، ولازم أتأكد الأول". ده الصح لأي داتا جاية من بره (body، JSON، env).
- في المرحلة 2 هنستخدم **Zod** عشان يعمل الـcheck ده بدالك.

---

## 7) Utility types — هتستخدمهم مع الـAPIs

```ts
interface User { id: string; name: string; email: string; password: string }

type UpdateUser = Partial<User>;               // كل الـfields بقت optional — للـPATCH
type PublicUser = Omit<User, "password">;      // من غير الباسورد — للـresponse
type LoginInput = Pick<User, "email" | "password">;
```
زي ما بتعمل `copyWith` بـparameters optional في Dart، `Partial` بيعمل نفس الفكرة على مستوى الـtype.

---

## ✍️ التمرين (بإيدك — من غير AI)

اعمل ملف `exercises/02-types.ts` وفيه نظام أوردرات بسيط:

1. `type OrderStatus` = `"pending" | "accepted" | "picked" | "delivered" | "cancelled"`.
2. `interface OrderItem` فيه `productId`، `quantity`، `unitPrice`.
3. `interface Order` فيه `id`، `customerId`، `items` (array من `OrderItem`)، `status`، `note` اختيارية، و`createdAt` تبقى `readonly`.
4. function اسمها `orderTotal(order: Order): number` بتحسب الإجمالي.
5. function اسمها `canMoveTo(from: OrderStatus, to: OrderStatus): boolean`. القواعد:
   - `pending` ← `accepted` أو `cancelled`
   - `accepted` ← `picked` أو `cancelled`
   - `picked` ← `delivered`
   - `delivered` و `cancelled` → مفيش
   (💡 hint: `Record<OrderStatus, OrderStatus[]>` هيخليك تكتبها من غير `if` كتير، وTS هيزعق لو نسيت حالة.)
6. `interface ApiResponse<T>` واعمل function اسمها `ok<T>(data: T, message?: string): ApiResponse<T>`.
7. `type UpdateOrder` = نفس الـOrder بس من غير `id` و `createdAt`، وكل الباقي optional. (💡 ادمج اتنين من الـutility types.)
8. **بونص:** function اسمها `parseStatus(input: unknown): OrderStatus | null` بتاخد أي حاجة وترجع status صالحة أو `null`. جرّبها بـ `"accepted"`، `"done"`، `42`، `null`.

اطبع نتايج كل function وشغّل:
```bash
npx tsx exercises/02-types.ts
npm run typecheck
```
الاتنين لازم يعدّوا من غير errors. ولما تخلّص قول **"راجع تمرين 02"**.

---

## ❓ أسئلة مراجعة
1. إيه الفرق بين `any` و `unknown`؟ وأنهي واحد تستخدمه مع `req.body`؟ وليه؟
2. يعني إيه structural typing؟ واديني مثال يبيّن فرقه عن Dart.
3. ليه `type Status = "a" | "b"` أحسن من `status: string`؟
4. إمتى تستخدم `Partial` وإمتى `Omit`؟ اديني مثال من API.
5. إيه الفرق بين `phone?: string` و `phone: string | undefined`؟ (فكّر في `exactOptionalPropertyTypes`)

---

## 📚 مصادر
- [TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
