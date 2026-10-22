# 📝 مراجعة المرحلة 1: كل الإجابات في مكان واحد

> للمذاكرة. اقراه في الـpreview (`Ctrl + Shift + V`).
> الإجابات دي اتكتبت بطلبك، وأغلبها الـAgent هو اللي جاوبها. **الطريقة الصح للمذاكرة:** اقرا السؤال، وغطّي الإجابة، وجاوب بصوت عالي أو في ورقة، وبعدين قارن.

## ⭐ الأهم: سؤال الـCheckpoint بتاع المرحلة
> لازم تجاوبه **بنفسك وبكلامك** قبل ما نروح لـExpress. هو سؤال 5 في الدرس 04 تحت.

**ليه `await` جوه `for` loop ممكن يكون بطيء؟ وإمتى تستخدم `Promise.all` بداله؟**

---

## الدرس 02: TypeScript Types
#### 1. `any` vs `unknown`، وأنهي واحد مع `req.body`؟
- `any` بتقفل الـtype checking خالص. هي نفسها **مابتضربش**، بس أي غلط بيعدّي من الـcompile ويضرب **وقت التشغيل**.
- `unknown` معناها "مش عارف النوع"، والـTS **مش هيسيبك تستخدمها** غير لما تتأكد من نوعها الأول (`typeof`، أو validation).
- مع `req.body` استخدم **`unknown`**: الداتا جاية من بره ومش مضمونة، فلازم تعمل validation الأول. (زي `parseStatus` في تمرين 02.)

#### 2. Structural typing
في Dart لازم الـobject يكون instance من الـclass. أما في TS، **أي object شكله مطابق ينفع**:
```ts
interface User { name: string }
const admin = { name: "Ali", role: "admin" };
const u: User = admin; // ✅ في TS، الشكل مطابق. وفي Dart ده compile error
```

#### 3. ليه `"a" | "b"` أحسن من `string`؟
- الـTS بيمسك الغلطة الإملائية (`"acepted"`) **وقت الكتابة**، بدل ما توصل للداتابيز.
- الـautocomplete بيقترحلك القيم المسموحة.
- مع `Record<Status, ...>` الـTS بيقولك لو نسيت حالة.

#### 4. `Partial` vs `Omit`
- **`Omit`** بيشيل fields: في `POST /orders` العميل مابيبعتش `id` ولا `createdAt` ← `Omit<Order, "id" | "createdAt">`.
- **`Partial`** بيخلي الكل اختياري: في `PATCH /orders/:id` العميل بيبعت اللي اتغيّر بس.
- مع بعض: `Partial<Omit<Order, "id" | "createdAt">>`.

#### 5. `phone?: string` vs `phone: string | undefined`
| | `phone?: string` | `phone: string \| undefined` |
| --- | --- | --- |
| تسيب الـkey خالص `{}` | ✅ | ❌ لازم تكتبه |
| تكتب `{ phone: undefined }` | ❌ (مع `exactOptionalPropertyTypes`) | ✅ |

`?` معناها "الـkey ممكن مايكونش موجود"، و`| undefined` معناها "الـkey موجود بس قيمته ممكن تبقى undefined".

---

## الدرس 03: ES Modules و CommonJS و npm
#### 1. ليه في ESM بتكتب `"./math.js"` رغم إن الملف `math.ts`؟
 لأن `"module": "nodenext"` بيمشي على قواعد Node، وNode في ESM لازم ياخد الامتداد. والملف اللي هيبقى موجود وقت التشغيل هو `orders.js` (بعد الـcompile)، فبتكتب اسمه هو. و`tsx` بيلاقي `orders.ts` لوحده.

#### 2. حوّل `require` و`module.exports` لـESM.

```js
import express from "express";
import { z } from "zod";
const router = express.Router();
export default router;
```
- `require("express")` كان بيرجع الـobject كله ← **default import**.
- `{ z }` كانت destructuring ← **named import**.
- `module.exports = router` (حاجة واحدة) ← **`export default`**.

#### 3. إيه الفرق بين `exports.a = 1` و`exports = { a: 1 }`؟

- `exports.a = 1` ← بتضيف `a` على نفس الـobject اللي `module.exports` بيشاور عليه ✅.
- `exports = { a: 1 }` ← بتخلّي المتغير المحلي `exports` يشاور على object **جديد**. أما `module.exports` فبيفضل على القديم الفاضي، والملف بيصدّر `{}` ❌. (جرّبناها: بترجع `{}` فعلًا.)

#### 4. `zod` و`vitest` و`mongoose` و`@types/express`: كل واحدة تروح فين؟
 السؤال: "السيرفر محتاجها وهو شغال في الـproduction؟"
| Package | مكانها | ليه |
| --- | --- | --- |
| `zod` | `dependencies` | بيعمل validation للـrequests وقت التشغيل |
| `mongoose` | `dependencies` | بيكلّم الداتابيز وقت التشغيل |
| `vitest` | `devDependencies` | للتستات بس |
| `@types/express` | `devDependencies` | types بس، بتتمسح بعد الـcompile |

#### 5. `"express": "^5.1.0"`: ممكن ينزّل `5.3.0`؟ وممكن ينزّل `6.0.0`؟

- `5.3.0` ✅ أيوه، لأن `^` بتقبل أي minor أو patch أعلى طول ما الـmajor هو `5`.
- `6.0.0` ❌ لأ، لأن الـmajor اتغيّر، وده معناه إن فيه تغييرات ممكن تكسر الكود.

#### 6. ليه `package-lock.json` بيتعمله commit و`node_modules` لأ؟

- `package-lock.json` بيسجّل النسخ **بالظبط** لكل package (حتى اللي جوه الـpackages). لما يتعمله commit، جهازك وجهاز زميلك والسيرفر بيبقى عندهم نفس الكود بالظبط.
- `node_modules` كبير جدًا، وبيتعمل من جديد من الـlock في أي وقت (`npm ci`). وكمان فيه ملفات native بتتبني مخصوص لكل نظام تشغيل، فاللي على Windows ماينفعش على Linux.

---

## الدرس 04: Event Loop
#### 1. thread واحد بيخدم 1000 request إزاي؟
الـJS بتاعك بيشتغل على thread واحد، بس هو **مابيستناش بنفسه**. لما request يحتاج داتابيز أو ملف أو network، Node بيبعت الطلب لنظام التشغيل أو للـthread pool، وبيروح يخدم الـrequest اللي بعده على طول. ولما الرد يرجع، الـcallback بتاعه بيدخل الطابور، والـevent loop بيشغّله. وأغلب وقت أي request في الـbackend **انتظار**، مش حسابات، فجرسون واحد بيكفّي.

#### 2. `await User.find()` vs `bcrypt.hashSync()`
- `await User.find()`: الـmain thread بيبعت الـquery ويبقى **فاضي** يخدم غيره لحد ما الداتابيز ترد. ✅
- `bcrypt.hashSync()`: الـmain thread **نفسه** بيعمل الحساب ومابيقدرش يعمل أي حاجة تانية لحد ما يخلّص. يعني كل الـrequests التانية واقفة. ❌ والحل `await bcrypt.hash()`، اللي بتبعت الحساب للـthread pool.

#### 3. ليه `/fast` استنى؟
لأن `/slow` شغّال `while` loop على الـmain thread، **الوحيد** اللي بيشغّل JS. الـrequest بتاع `/fast` وصل للسيرفر فعلًا، بس الـcallback بتاعه مستني في الطابور، ومافيش حد فاضي يشغّله لحد ما الـloop تخلص. (4921ms ≈ الـ5 ثواني ناقص الـ100ms اللي استنيناها قبل ما نبعته.)

#### 4. الترتيب
`console.log` (sync) ← `Promise.then` (microtask) ← `setTimeout(0)` (timers).
واللي ممكن يتبدل مع `setImmediate` هو **`setTimeout(0)`**، وده لما يتعمل في أول الملف (main module). أما جوه I/O callback، فـ`setImmediate` دايمًا الأول.

#### 5. الـCheckpoint: `await` جوه `for` vs `Promise.all`
- **ليه بطيء:** كل `await` بيوقّف الـloop لحد ما العملية دي تخلص، فالطلبات بتتبعت **واحد ورا التاني**، والوقت الكلي بيبقى **مجموع** الأوقات (5 × 200 = 1000ms).
- **`Promise.all`:** بتبدأ الكل **مع بعض**، والوقت الكلي بيبقى **أطول واحد** بس (200ms).
- **استخدم `Promise.all` لما** العمليات مستقلة عن بعض: هات user والأوردرات بتاعته والإحصائيات مع بعض.
- **ماينفعش تستخدمه لما:**
  - كل خطوة محتاجة نتيجة اللي قبلها (هات الـuser، وبعدين بالـ`regionId` بتاعه هات سعر الشحن).
  - لازم الترتيب (اخصم من المخزن، وبعدين اعمل الأوردر).
  - العدد كبير جدًا (10,000 request للداتابيز مع بعض هيضغطها، فالأحسن تقسّمهم دفعات).
  - **وخلي بالك:** `Promise.all` بتفشل كلها لو واحدة بس فشلت. (الدرس 05: `allSettled`.)

#### 6. المقابل في Flutter
`Isolate.run()` أو `compute()`. وفي الاتنين بتحتاجه لنفس السبب: **شغل CPU تقيل** هيوقّف الـthread الوحيد.
- في Flutter: parsing لـJSON ضخم، أو معالجة صورة، عشان الـUI مايهنّجش.
- هنا: hashing، أو ضغط صور، أو حسابات تقيلة، عشان باقي المستخدمين مايستنوش.
- الفرق: الـworker والـisolate الاتنين مالهمش memory مشتركة مع الـmain thread، والتواصل بيحصل برسايل (`postMessage` / `SendPort`).

---

## الدرس 05: Promises و async/await
### الـ3 bugs بتوع التمرين
| # | فين | المشكلة | الحل |
| --- | --- | --- | --- |
| 1 | `saveAll` | `forEach(async)` مابيستناش، فـ`"all saved"` بتتطبع قبل الحفظ، والـerrors بتهرب | `await Promise.all(ids.map(...))` |
| 2 | `safeSave` | `return` من غير `await` جوه `try`، فالـrejection بيعدّي من الـcatch والـprocess بيقع | `await saveOrder(id); return "ok";` |
| 3 | `main` | `saveAll([1, 2])` من غير `await`، فالـtry/catch مايقدرش يمسك أي حاجة | `await saveAll([1, 2])` |

### الأسئلة
#### 1. Error-first callback
callback شكلها `(err, result) => {}`. أول parameter هو الـerror (`null` لو مافيش)، والتاني النتيجة. ده عرف Node القديم في `fs` و`crypto` وغيرهم.
وفي Express هتشوفه في **`next(err)`**: لما تنادي `next` ومعاها error، Express بيبعتها للـerror middleware، ولما تنادي `next()` فاضية بيكمّل للـmiddleware اللي بعده. والـerror middleware نفسه شكله `(err, req, res, next)`، أول parameter فيه برضه هو الـerror.

#### 2. `async function f() { return 5 }`
`f()` نوعها `Promise<number>`. أي `async function` **دايمًا** بترجع Promise، لأن `async` معناها "النتيجة ممكن تيجي بعدين"، فـJS بيلف القيمة في Promise حتى لو رجعت على طول. نفس `Future<int>` في Dart بالظبط.

#### 3. ليه الـtry/catch مامسكش لما نسينا `await`؟
من غير `await`، الـfunction بتبدأ الـPromise وتكمّل **على طول**، فالـtry بيخلص وهو فاكر إن كله تمام. ولما الـPromise تترفض **بعدين**، بيكون الكود خرج من الـtry خلاص، فالـerror بيبقى unhandled rejection، والـprocess بيقع.

#### 4. `all` vs `allSettled`
- **`all`:** محتاج **كل** النتايج، ولو واحدة فشلت مالهاش لازمة تكمّل. مثال: صفحة أوردر محتاجة الـorder والـproducts والـaddress، ولو حاجة فيهم فشلت ترجع error.
- **`allSettled`:** عايز تجرّب الكل وتعرف مين نجح ومين فشل. مثال: تبعت إشعار لـ100 مستخدم، أو ترفع 5 صور. لو واحدة فشلت، الباقي يكمّل، وترجع للعميل مين فشل.

#### 5. لما `Promise.all` بيفشل، الباقيين بيحصلهم إيه؟
**بيكمّلوا شغلهم عادي في الخلفية.** `Promise.all` بيرفض فورًا، بس مابيلغيش حاجة، والنتايج بتاعتهم بتترمي. فلو كانوا بيكتبوا في الداتابيز، الكتابة **حصلت فعلًا**.
- **Dart:** `Future.wait` (افتراضيًا `eagerError: false`) **بيستنى الكل يخلص** وبعدين يرمي أول error.
- **JS:** `Promise.all` بيرفض **فورًا** من غير ما يستنى. ولو عايز تستنى الكل، استخدم `allSettled`.

#### 6. ليه `ids.forEach(async ...)` غلط؟
لأن `forEach` بيتجاهل اللي الـcallback بترجّعه، فالـPromises بتترمي، ومحدش بيستناها ولا بيمسك الـerrors بتاعتها. والحلّين:
```ts
for (const id of ids) await save(id);           // بالترتيب، لو كل واحدة محتاجة اللي قبلها أو الترتيب مهم
await Promise.all(ids.map((id) => save(id)));   // مع بعض، لو مستقلين
```

#### 7. `catchAsyncError` في Express 4 vs Express 5
- **Express 4** اتعمل قبل الـPromises، فهو بينادي الـhandler ومابيبصّش على اللي بيرجع. فلو الـasync handler رمى error، الـPromise بتترفض ومحدش يمسكها: الـrequest يفضل معلّق، أو السيرفر يقع. وعشان كده `catchAsyncError` بتلف الـhandler وتعمل `.catch(next)`، يعني بتحوّل الـrejection لـ`next(err)`.
- **Express 5** بيبص على الـPromise اللي الـhandler رجّعها، ولو اترفضت بيبعتها لـ`next(err)` لوحده. فمش محتاج `catchAsyncError` خالص.
