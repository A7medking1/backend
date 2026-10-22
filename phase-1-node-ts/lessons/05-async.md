# الدرس 05 — من Callbacks لـPromises لـ`async/await`

> **الهدف:** تكتب كود async صح في الـbackend: تعرف تحوّل أي API قديم لـPromise، وتمسك الـerrors كلها، وتختار بين `Promise.all` و`allSettled` و`race`، وتتجنّب الأخطاء اللي بتوقّع السيرفر في الـproduction.
> **الوقت المتوقع:** ساعتين.
> **خبر حلو:** `Future` في Dart = `Promise` في JS، و`async/await` **نفس الشكل تقريبًا**. ركّز على **الفروق**: الـerrors اللي محدش مسكها بتقفل السيرفر، و`forEach` مع `async`، و`Promise.all` اللي بيفشل بسرعة.

> كل النتايج في الدرس ده **اتجربت فعلًا** على Node v24.14.0.

---

## 1) القاموس: Dart ↔ JS

| Dart | JS / TS |
| --- | --- |
| `Future<User>` | `Promise<User>` |
| `async` / `await` | `async` / `await` (نفس الحاجة) |
| `.then()` / `.catchError()` / `.whenComplete()` | `.then()` / `.catch()` / `.finally()` |
| `Future.value(5)` / `Future.error(e)` | `Promise.resolve(5)` / `Promise.reject(e)` |
| `Completer<T>` | `new Promise((resolve, reject) => ...)` أو `Promise.withResolvers()` |
| `Future.wait([...])` | `Promise.all([...])` ⚠️ (الفرق في قسم 5) |
| `Future.any([...])` | `Promise.any` / `Promise.race` |
| `Future.delayed(Duration(ms: 50))` | `await setTimeout(50)` من `node:timers/promises` |
| `.timeout(Duration(...))` | `Promise.race` مع timer، أو `AbortSignal.timeout(ms)` |

---

## 2) المرحلة الأولى: Callbacks (الكود القديم)

قبل الـPromises، كل حاجة async في Node كانت بتاخد **function في الآخر** تتنادى لما الشغل يخلص:
```ts
import { readFile } from "node:fs";

readFile("config.json", "utf8", (err, data) => {
  if (err) {                 // ← دايمًا أول parameter هو الـerror
    console.error("failed", err);
    return;
  }
  console.log(data);
});
```
### Error-first callback (عرف Node)
الـcallback دايمًا شكلها `(err, result) => {}`:
- لو حصل error: `err` بيبقى فيه الـerror، و`result` بيبقى `undefined`.
- لو نجح: `err` بيبقى `null`، و`result` بيبقى فيه النتيجة.

### Callback hell 🔥
لما تحتاج 3 عمليات ورا بعض:
```js
getUser(id, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getProducts(orders[0].id, (err, products) => {
      if (err) return handle(err);
      // ... وكل ما تزوّد خطوة، الكود يدخل لجوه أكتر
    });
  });
});
```
**ليه تعرف ده؟** هتلاقيه في كود قديم، وفي مكتبات قديمة، وفي Express نفسه: `(req, res, next)` هي callback style. و`next(err)` هي نفس فكرة الـerror-first.

---

## 3) المرحلة التانية: Promises

الـPromise هو object بيمثّل **نتيجة لسه ماجتش**. وليه 3 حالات:
```
pending ──┬──> fulfilled (نجح، ومعاه value)
          └──> rejected  (فشل، ومعاه error)
```
وبمجرد ما يبقى fulfilled أو rejected **مابيتغيّرش تاني**.

### تعمل Promise بنفسك (زي `Completer`)
```ts
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}
```
### تحوّل callback لـPromise (هتعملها كتير مع كود قديم)
```ts
import { readFile } from "node:fs";

function readFileAsync(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(path, "utf8", (err, data) => {
      if (err) reject(err);   // ← callback فشلت ← الـPromise يبقى rejected
      else resolve(data);     // ← callback نجحت ← الـPromise يبقى fulfilled
    });
  });
}
```
أو Node يعملها لك، طالما الـfunction بتمشي على عرف error-first:
```ts
import { promisify } from "node:util";
const readFileAsync = promisify(readFile);
```
> 💡 أغلب الـbuilt-ins دلوقتي ليها نسخة Promise جاهزة: `node:fs/promises`، و`node:timers/promises`، و`node:dns/promises`. **استخدمها هي على طول.**

### `Promise.withResolvers()` (Node 22+) = `Completer` بالظبط
```ts
const { promise, resolve, reject } = Promise.withResolvers<string>();
setTimeout(() => resolve("resolved later"), 10);
console.log(await promise);   // resolved later
```
مفيدة لما الـresolve هيحصل من مكان تاني خالص (مثلًا event).

### `.then` chaining
```ts
getUser(1)
  .then((user) => getOrders(user.id))   // لو رجّعت Promise، اللي بعده بيستناه
  .then((orders) => console.log(orders))
  .catch((err) => console.error(err))   // بيمسك أي error من أي خطوة فوق
  .finally(() => console.log("done"));
```

---

## 4) المرحلة التالتة: `async/await` (اللي هتكتب بيه)

```ts
async function getUserOrders(id: number): Promise<Order[]> {
  const user = await getUser(id);
  const orders = await getOrders(user.id);
  return orders;
}
```
- `async function` **دايمًا** بترجع Promise، حتى لو كتبت `return 5`، هترجع `Promise<number>` (جرّبناها: `f() instanceof Promise` طلعت `true`).
- `await` بتوقّف **الـfunction دي بس** لحد ما الـPromise تخلص، **مش السيرفر** (الدرس 04: الجرسون بيروح يخدم غيره).
- في TS، اكتب الـreturn type: `Promise<Order[]>`.

### الـerrors: `try/catch`
```ts
async function handler() {
  try {
    const user = await getUser(1);
  } catch (err) {
    // ⚠️ في TS strict، err نوعها unknown (فاكر الدرس 02؟)
    if (err instanceof Error) {
      console.error(err.message);
    }
  }
}
```
> زي Dart بالظبط، بس في Dart بتكتب `on SomeException catch (e)`. هنا مافيش تصفية بالنوع، فبتعمل `instanceof` بنفسك.

---

## 5) الـCombinators: لما عندك أكتر من Promise

### `Promise.all`: الكل لازم ينجح
```ts
const [user, orders, stats] = await Promise.all([
  getUser(id),
  getOrders(id),
  getStats(id),
]);
```
- بيبدأ التلاتة **مع بعض**، والوقت = أطول واحد. (الدرس 04: `1015ms` بقت `200ms`.)
- النتايج بترجع **بنفس الترتيب** اللي بعتّه بيه، مش بترتيب اللي خلص الأول.
- **أول ما واحد يفشل، الكل بيفشل على طول (fail-fast):**
```
all rejected: b after 65 ms     ← b فشل في 50ms، و Promise.all رفض على طول
  finished a                    ← ⚠️ بس a و c كمّلوا شغلهم في الخلفية!
  finished c
```
> ⚠️ **فرق مهم عن Dart:** `Future.wait` في Dart **بيستنى الكل** الأول (`eagerError: false` افتراضيًا)، وبعدين يرمي أول error. أما `Promise.all` فبيرفض **فورًا**، ومش بيلغي الباقيين. يعني لو التلاتة كانوا بيكتبوا في الداتابيز، اللي نجح **اتكتب فعلًا**.

### `Promise.allSettled`: عايز نتيجة الكل، حتى اللي فشل
```ts
const results = await Promise.allSettled([sendEmail(), sendSms(), sendPush()]);
// [{status:"fulfilled",value:"x"}, {status:"rejected",reason:Error("y")}]

for (const r of results) {
  if (r.status === "fulfilled") console.log("ok", r.value);
  else console.log("failed", r.reason);
}
```
**إمتى تستخدمه:** عمليات **مستقلة**، وفشل واحدة ماينفعش يبوّظ الباقي. زي إشعارات لـ100 مستخدم: لو واحد الـtoken بتاعه بايظ، الـ99 لازم يوصلهم.

### `Promise.race`: أول واحد يخلص، نجح أو فشل
الاستخدام الأشهر ليه هو الـ**timeout**:
```ts
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms));
  return Promise.race([p, timeout]);
}
// race: timeout
```
> ⚠️ الـPromise البطيئة **مابتتلغيش**. في التجربة، `"finished slow"` اتطبعت بعد كده. الـrace بيحدد إنت هتستنى إيه، بس مابيوقّفش الشغل نفسه. ولو عايز توقّف الشغل فعلًا، يبقى **`AbortSignal`**:
```ts
await fetch(url, { signal: AbortSignal.timeout(3000) });  // بيلغي الـrequest فعلًا
// الـerror اللي بيطلع: TimeoutError
```

### `Promise.any`: أول واحد **ينجح**
```ts
const data = await Promise.any([fromCache(), fromDb()]);  // أسرع واحد ينجح
// لو الكل فشل ← AggregateError (فيه .errors بكل الأسباب)
```

| | بيرجع إمتى | لو حصل فشل |
| --- | --- | --- |
| `all` | الكل نجح | أول فشل ← reject فورًا |
| `allSettled` | الكل خلص | مابيعملش reject أبدًا، بيرجع status لكل واحد |
| `race` | أول واحد خلص | لو أول واحد فشل ← reject |
| `any` | أول واحد نجح | لو الكل فشل ← `AggregateError` |

---

## 6) أخطاء بتقع فيها في الـproduction 🚨

### ❌ 1. Promise اترفضت ومحدش مسكها = السيرفر بيقع
```ts
setTimeout(() => console.log("still alive?"), 100);
Promise.reject(new Error("boom"));
```
النتيجة: `Error: boom`، والـ**process بيقفل بـexit code 1**، و`"still alive?"` **مااتطبعتش خالص**.
من Node 15، أي rejection محدش مسكها بتقفل الـprocess كله. وده **صح**، لأن السيرفر بقى في حالة مش معروفة.
> 🔍 في salla: `process.on("unhandledRejection", (err) => console.log(...))` بتمنع القفل ده وتكمّل عادي. السيرفر بيكمّل وهو ممكن يكون بايظ، ومحدش هياخد باله غير من الـlogs.

### ❌ 2. نسيت `await` ← الـ`try/catch` مابيمسكش
```ts
async function handler() {
  try {
    save();                        // ← نسيت await
    console.log("handler: saved!");
  } catch (e) {
    console.log("caught", e);      // ← عمره ما هيوصل هنا
  }
}
```
النتيجة:
```
handler: saved!          ← 😱 كدب! الحفظ فشل
UNHANDLED: db down       ← والـerror هرب بره الـtry
```
من غير `await`، الـfunction **مابتستناش** الـPromise، والـtry بيخلص قبل ما الـerror يحصل.
> 💡 فيه rule في ESLint اسمها `@typescript-eslint/no-floating-promises` بتمسك الغلطة دي. هنفعّلها في الدرس 07.

### ❌ 3. `forEach` مع `async`
```ts
ids.forEach(async (id) => {
  await save(id);
  console.log("saved", id);
});
console.log("forEach done?");
```
النتيجة:
```
forEach done?    ← 😱 اتطبعت الأول! forEach مابيستناش
saved 1
saved 2
saved 3
```
`forEach` مابيعرفش حاجة عن الـPromises. بيشغّل الـfunction ويرمي الـPromise اللي رجعت ويكمّل. والحل حسب اللي محتاجه:
```ts
for (const id of ids) await save(id);           // بالترتيب، واحدة ورا التانية
await Promise.all(ids.map((id) => save(id)));   // كلهم مع بعض
```
> 🔍 ده نفس اللي في Dart: `list.forEach((x) async {...})` برضه مابيستناش. والحل هناك `for` أو `Future.wait`.

### ❌ 4. `return` من غير `await` جوه `try`
```ts
async function a() {
  try { return fails(); }          // ← رجّع الـPromise من غير ما يستناها
  catch { return "caught in a"; }
}
async function b() {
  try { return await fails(); }    // ← استناها جوه الـtry
  catch { return "caught in b"; }
}
// a leaked: inner     ← الـcatch بتاع a مامسكش
// caught in b         ← ✅
```
**القاعدة:** جوه `try`، اكتب دايمًا `return await`.

---

## 7) ليه ده مهم في Express؟

**Express 4** (زي salla) **مابيمسكش** الـerrors بتاعة الـasync handlers لوحده:
```js
// Express 4: لو findById رمى error، الـrequest هيفضل معلّق، أو السيرفر هيقع
app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
```
عشان كده salla عامل `catchAsyncError`:
```js
export const catchAsyncError = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));  // ← حوّل الـrejection لـnext(err)
  };
};
```
لاحظ إنها **Promise بتتحوّل لـcallback style** (`next(err)`)، يعني عكس اللي عملناه في قسم 3.

**Express 5** بيعمل ده **لوحده**: أي async handler رجّع rejected Promise، Express بيبعته للـerror middleware. فمش محتاج `catchAsyncError`. (هنشوفه في المرحلة 2.)

---

## ✍️ التمرين (بإيدك — من غير AI)
اعمل فولدر `exercises/05-async/`.

### أ) من callback لـPromise (`callbacks.ts`)
ده API قديم:
```ts
interface User { id: number; name: string }

function getUserCb(id: number, cb: (err: Error | null, user?: User) => void): void {
  setTimeout(() => {
    if (id <= 0) cb(new Error("invalid id"));
    else cb(null, { id, name: `user${id}` });
  }, 100);
}
```
1. اكتب `getUser(id: number): Promise<User>` **بإيدك** بـ`new Promise`.
2. اكتب نسخة تانية بـ`promisify`.
3. جرّب الاتنين بـ`id = 1` و`id = 0`، وامسك الـerror بـ`try/catch`.

### ب) صلّح الـbugs (`bugs.ts`)
الكود ده فيه **3 bugs**. لاقيهم وصلّحهم، واكتب كومنت جنب كل واحد:
```ts
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function saveOrder(id: number): Promise<void> {
  await wait(50);
  if (id === 3) throw new Error(`order ${id} failed`);
  console.log("saved", id);
}

async function saveAll(ids: number[]): Promise<void> {
  ids.forEach(async (id) => {
    await saveOrder(id);
  });
  console.log("all saved");
}

async function safeSave(id: number): Promise<string> {
  try {
    return saveOrder(id).then(() => "ok");
  } catch {
    return "failed";
  }
}

async function main() {
  try {
    saveAll([1, 2]);
  } catch (e) {
    console.log("caught", e);
  }
  console.log(await safeSave(3));
}

await main();
```

> 💡 الكود ده **بيعدّي الـtypecheck من غير ولا error**، بس لما تشغّله هتلاقي `"all saved"` بتتطبع **قبل** `"saved 1"`، والـprocess بيقع بـ`Error: order 3 failed`. يعني الـTS مش هيحميك من الأخطاء دي، لازم تفهمها بنفسك.

### ج) `withTimeout` (`timeout.ts`)
اكتب `withTimeout<T>(p: Promise<T>, ms: number): Promise<T>`، وجرّبها:
- على Promise بتاخد 100ms مع timeout 300 ← المفروض ترجع النتيجة.
- وعلى نفس الـPromise مع timeout 50 ← المفروض ترمي `"timeout"`.

### د) Dashboard (`dashboard.ts`)
اعمل 4 functions وهمية:
- `getUser(id)`: 100ms.
- `getOrders(userId)`: 150ms.
- `getStats(userId)`: 120ms.
- `sendNotification(userId, channel)`: 50ms، وبتفشل لو `channel === "sms"`.

واكتب `loadDashboard(id)` بالشكل ده:
1. هات الـuser **الأول**، لأن الباقي محتاج الـ`id` بتاعه.
2. هات الـorders والـstats **مع بعض**. اختار الـcombinator الصح.
3. ابعت notifications على `["email", "sms", "push"]` **مع بعض**، وفشل واحد **مايبوّظش** الباقي.
4. اطبع الوقت الكلي. (المفروض حوالي 100 + 150 + 50 = **~300ms**.)

### هـ) بونص: `retry` (`retry.ts`)
اكتب `retry<T>(fn: () => Promise<T>, times: number): Promise<T>` بتعيد المحاولة لحد `times` مرة، وتستنى 100ms بين كل محاولة. جرّبها على function بتفشل أول مرتين وتنجح في التالتة.

شغّل كل ملف بـ`npx tsx exercises/05-async/<file>.ts`، وفي الآخر `npm run typecheck`.
ولما تخلّص قول **"راجع تمرين 05"**.

---

## ❓ أسئلة مراجعة
1. إيه هو الـerror-first callback؟ وفين لسه هتشوفه في Express؟
2. `async function f() { return 5 }`: إيه نوع `f()`؟ وليه؟
3. ليه الـ`try/catch` مامسكش الـerror لما نسينا `await`؟
4. إيه الفرق بين `Promise.all` و`Promise.allSettled`؟ اديني مثال من الـbackend لكل واحد.
5. لو `Promise.all` فشل بسبب واحدة، الباقيين بيحصلهم إيه؟ وده بيفرق إزاي عن `Future.wait` في Dart؟
6. ليه `ids.forEach(async ...)` غلط؟ واكتب الحلّين.
7. ليه Express 4 كان محتاج `catchAsyncError`؟ وإيه اللي اتغيّر في Express 5؟

---

## ✅ الحل والإجابات
> الـAgent حل التمرين وجاوب الأسئلة بطلبي (2026-10-21). الكود في [exercises/05-async/](../exercises/05-async/)، وكل ملف فيه كومنتات بتشرح ليه. ارجعلهم وحاول تقولهم بكلامك.

### نتايج التمرين (اتشغّلت فعلًا، والـtypecheck عدّى)
| الجزء | الملف | النتيجة |
| --- | --- | --- |
| أ | `callbacks.ts` | `id=1` ← ok، و`id=0` ← `failed -> invalid id` (بالطريقتين: بإيدك و`promisify`) |
| ب | `bugs.ts` | `saved 1` ← `saved 2` ← `all saved` ← `failed` (exit 0، مابقاش بيقع) |
| ج | `timeout.ts` | `300ms -> data` و `50ms -> error: timeout` |
| د | `dashboard.ts` | الكل رجع، والـsms فشل لوحده، والوقت **326ms** (~100 + 150 + 50) |
| هـ | `retry.ts` | `succeeded on call 3`، ولما `times = 2` ← `gave up: call 2 failed` |

### الـ3 bugs في `bugs.ts`
| # | فين | المشكلة | الحل |
| --- | --- | --- | --- |
| 1 | `saveAll` | `forEach(async)` مابيستناش، فـ`"all saved"` بتتطبع قبل الحفظ، والـerrors بتهرب | `await Promise.all(ids.map(...))` |
| 2 | `safeSave` | `return` من غير `await` جوه `try`، فالـrejection بيعدّي من الـcatch والـprocess بيقع | `await saveOrder(id); return "ok";` |
| 3 | `main` | `saveAll([1, 2])` من غير `await`، فالـtry/catch مايقدرش يمسك أي حاجة | `await saveAll([1, 2])` |

### حاجات زيادة في الحل تاخد بالك منها
- **`timeout.ts`:** الـ`finally(() => clearTimeout(timer))` بتلغي الـtimer لما الـPromise تخلص. من غيرها، الـtimer بيفضل شغال على الفاضي، ولو الـtimeout طويل (مثلًا 30 ثانية) الـprocess هيفضل مستنيه قبل ما يقفل.
- **`dashboard.ts`:** الـ`channels[i]` بتربط كل نتيجة بالقناة بتاعتها. ده بيشتغل لأن `allSettled` بيرجّع النتايج **بنفس ترتيب** الـinput.
- **`retry.ts`:** هنا `return await fn()` **ضروري** (bug 2 بالظبط). من غير `await`، الـcatch مش هيمسك الفشل، والـretry مش هيحصل خالص.

### إجابات أسئلة المراجعة
**1. Error-first callback**
callback شكلها `(err, result) => {}`. أول parameter هو الـerror (`null` لو مافيش)، والتاني النتيجة. ده عرف Node القديم في `fs` و`crypto` وغيرهم.
وفي Express هتشوفه في **`next(err)`**: لما تنادي `next` ومعاها error، Express بيبعتها للـerror middleware، ولما تنادي `next()` فاضية بيكمّل للـmiddleware اللي بعده. والـerror middleware نفسه شكله `(err, req, res, next)`، أول parameter فيه برضه هو الـerror.

**2. `async function f() { return 5 }`**
`f()` نوعها `Promise<number>`. أي `async function` **دايمًا** بترجع Promise، لأن `async` معناها "النتيجة ممكن تيجي بعدين"، فـJS بيلف القيمة في Promise حتى لو رجعت على طول. نفس `Future<int>` في Dart بالظبط.

**3. ليه الـtry/catch مامسكش لما نسينا `await`؟**
من غير `await`، الـfunction بتبدأ الـPromise وتكمّل **على طول**، فالـtry بيخلص وهو فاكر إن كله تمام. ولما الـPromise تترفض **بعدين**، بيكون الكود خرج من الـtry خلاص، فالـerror بيبقى unhandled rejection، والـprocess بيقع.

**4. `all` vs `allSettled`**
- **`all`:** محتاج **كل** النتايج، ولو واحدة فشلت مالهاش لازمة تكمّل. مثال: صفحة أوردر محتاجة الـorder والـproducts والـaddress، ولو حاجة فيهم فشلت ترجع error.
- **`allSettled`:** عايز تجرّب الكل وتعرف مين نجح ومين فشل. مثال: تبعت إشعار لـ100 مستخدم، أو ترفع 5 صور. لو واحدة فشلت، الباقي يكمّل، وترجع للعميل مين فشل.

**5. لما `Promise.all` بيفشل، الباقيين بيحصلهم إيه؟**
**بيكمّلوا شغلهم عادي في الخلفية.** `Promise.all` بيرفض فورًا، بس مابيلغيش حاجة، والنتايج بتاعتهم بتترمي. فلو كانوا بيكتبوا في الداتابيز، الكتابة **حصلت فعلًا**.
- **Dart:** `Future.wait` (افتراضيًا `eagerError: false`) **بيستنى الكل يخلص** وبعدين يرمي أول error.
- **JS:** `Promise.all` بيرفض **فورًا** من غير ما يستنى. ولو عايز تستنى الكل، استخدم `allSettled`.

**6. ليه `ids.forEach(async ...)` غلط؟**
لأن `forEach` بيتجاهل اللي الـcallback بترجّعه، فالـPromises بتترمي، ومحدش بيستناها ولا بيمسك الـerrors بتاعتها. والحلّين:
```ts
for (const id of ids) await save(id);           // بالترتيب، لو كل واحدة محتاجة اللي قبلها أو الترتيب مهم
await Promise.all(ids.map((id) => save(id)));   // مع بعض، لو مستقلين
```

**7. `catchAsyncError` في Express 4 vs Express 5**
- **Express 4** اتعمل قبل الـPromises، فهو بينادي الـhandler ومابيبصّش على اللي بيرجع. فلو الـasync handler رمى error، الـPromise بتترفض ومحدش يمسكها: الـrequest يفضل معلّق، أو السيرفر يقع. وعشان كده `catchAsyncError` بتلف الـhandler وتعمل `.catch(next)`، يعني بتحوّل الـrejection لـ`next(err)`.
- **Express 5** بيبص على الـPromise اللي الـhandler رجّعها، ولو اترفضت بيبعتها لـ`next(err)` لوحده. فمش محتاج `catchAsyncError` خالص.

---

## 📚 مصادر
- [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN — Promise (all / allSettled / race / any)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Node.js — util.promisify](https://nodejs.org/api/util.html#utilpromisifyoriginal)
- [Node.js — timers/promises](https://nodejs.org/api/timers.html#timers-promises-api)
- [Express — Error handling (Express 5 و async)](https://expressjs.com/en/guide/error-handling.html)
