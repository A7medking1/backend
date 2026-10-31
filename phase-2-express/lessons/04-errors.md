# المرحلة 2 — الدرس 04: الـErrors

> **الهدف:** تفهم رحلة الـerror جوه Express، وتكتب error handler مركزي بتاعك، وتعمل `AppError`، وتعرف ليه Express 5 غيّر قواعد الـasync.
> **الوقت المتوقع:** ساعة ونص.
> **من الدرس ده:** مفيش salla. كل الأمثلة من مشروعك `phase-2-express` ومن تجارب اتعملت فعلًا.

> كل الأمثلة **اتجربت فعلًا**: Express 5.3.0 و Express 4.22.3 على Node 24.

---

## 0) ليه الدرس ده؟ (من المراجعة اللي فاتت)
في مراجعة تمرين 03 لقينا إن JSON بايظ في الـbody رجّع **صفحة HTML فيها stack trace ومسارات ملفات جهازك**:
```
SyntaxError: Expected property name or '}' in JSON at position 1
    at JSON.parse (<anonymous>)
    at parse (/Users/a7med/.../body-parser/lib/types/json.js:91:21)
```
ده معناه إن أي error مش متوقع هيطلع للعميل كده. الدرس ده بيقفل الباب ده.

---

## 1) أول فكرة: الـerror في Express بيمشي في طريق تاني
افتكر الدرس 02: الـrequest بيعدّي على middlewares بالترتيب، وكل واحد بينادي `next()`.

لما حاجة تقع، Express **بيقفز** فوق كل الـmiddlewares والـroutes العادية، ويدوّر على أول **error middleware** بعد مكانه.

```
request → helmet → cors → morgan → json → route ──💥 throw
                                                  │
                         (بيتخطى كل اللي عادي)    ▼
                                           error handler → response
```

### إزاي Express يعرف إن ده error middleware؟
من **عدد الـparameters**. لو الـfunction واجهتها **4 بالظبط** (`err, req, res, next`)، يبقى ده error handler:
```ts
app.use((err, req, res, next) => { ... });   // 4 params ← error handler
app.use((req, res, next) => { ... });        // 3 params ← middleware عادي
```
اتأكدت بـ`.length`: الـfunction بـ4 parameters بتدّي `4`، لكن `(...a) => {}` بتدّي `0` و`(e, q, r, n = 1) => {}` بتدّي `3`، فـExpress مش هيعتبرهم error handler. **لازم الأربعة يتكتبوا حتى لو مش هتستخدم `next`.**

### المقارنة بـDart/Flutter
| Dart | Express |
| --- | --- |
| `try { ... } catch (e) { ... }` في كل مكان | بتسيب الـerror يطلع، والـhandler المركزي يمسكه |
| `Dio` interceptor `onError` | الـerror middleware (نفس الفكرة بالظبط) |
| `FlutterError.onError` / `runZonedGuarded` (آخر خط دفاع) | الـerror handler المركزي |
| `throw ServerException(...)` ثم `Either<Failure, T>` | `throw new AppError(...)` ثم الـhandler يحوّله لرد |

---

## 2) إزاي الـerror بيوصل للـhandler؟ (3 طرق)

```ts
// 1) throw عادي (sync)
app.get("/a", () => { throw new Error("boom"); });

// 2) next(err) صريح
app.get("/b", (req, res, next) => next(new AppError(409, "conflict")));

// 3) async function بترمي أو بترجّع rejected promise   ← جديد في Express 5
app.get("/c", async () => { throw new Error("boom"); });
```
الـ3 اتجربوا وكلهم وصلوا للـhandler.

> ⚠️ **أي حاجة تتعمل `throw` بتوصل، حتى لو مش `Error`.** جربت `throw "just a string"` ووصلت للـhandler. عشان كده الـhandler لازم يفترض إن `err` ممكن يبقى أي حاجة.

---

## 3) Express 5 vs Express 4: الـasync (أهم فرق في الدرس)

### Express 5 (مشروعك)
لو الـhandler `async` ورمى error أو الـpromise اتعملها reject، Express **بينادي `next(err)` لوحده**. مش محتاج حاجة.
```ts
app.get("/c", async (req, res) => {
  const order = await findOrder(1);   // لو رمت ← الـhandler المركزي
  res.json(order);
});
```

### Express 4 (الكود القديم في الشركة)
جربتها: الـasync handler اللي بيرمي error **وقّع السيرفر كله** على Node 24:
```
app.get("/async", async () => { throw new Error("boom"); });
→ [000] (مفيش رد)، والـprocess مات من unhandled rejection
```
فالناس كانت بتحل بواحد من اتنين:
```js
// 1) wrapper بتاعهم (الأشهر)
const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);
app.get("/x", catchAsync(async (req, res) => { ... }));

// 2) مكتبة express-async-errors (بتعمل patch على Express 4 مرة واحدة)
require("express-async-errors");
```
وده جربته: `.catch(next)` شغّال في Express 4 ورجّع الـ500 من الـhandler.

> **القاعدة وإنت بتقرا كود الشركة:** لو شفت `catchAsync` أو `asyncHandler` أو `express-async-errors` حوالين الـhandlers، ده Express 4. في Express 5 مش محتاجها. وفي مشروعك **متكتبهاش**.

### الحاجة اللي Express 5 مش بيحميك منها
```ts
app.get("/timer", () => {
  setTimeout(() => { throw new Error("in timer"); }, 10);
});
```
جربتها: **السيرفر وقع كله**. الـ`throw` جوه callback بيحصل بعد ما الـhandler خلص، فمفيش حد في Express يمسكه (رجوع لدرس Event Loop). القاعدة: Express بيمسك اللي بيحصل **جوه** الـhandler (sync أو `await`). أي callback بيشتغل بعدين: لف الكود بـ`try/catch` وناد `next(err)` بإيدك.

---

## 4) الـdefault error handler (اللي بيشتغل لو مكتبتش واحد)
Express فيه handler جاهز في آخر السلسلة. جربته بالـerror `"secret detail"`:

| `NODE_ENV` | الرد |
| --- | --- |
| `development` (الافتراضي) | صفحة HTML فيها **stack trace كامل** |
| `production` | صفحة HTML فيها `Internal Server Error` بس |

يعني:
1. الرد **HTML مش JSON**، وFlutter مستني JSON بالشكل `{ ok, error }`. الـparsing هيقع.
2. في الـdev بيسرّب المسارات. ولو نسيت تظبط `NODE_ENV` في السيرفر الحقيقي، هيسرّب هناك كمان.

عشان كده بنكتب handler بتاعنا.

---

## 5) `AppError`: الـerror اللي إحنا نعرفه
مش كل error "وقعة". فيه errors **متوقعة**: الأوردر مش موجود، الـid غلط، مفيش صلاحية. دي مش bugs، دي حالات عمل. بنعمل class لها:

```ts
export class AppError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
```
**ملاحظات:**
- `extends Error` عشان يبقى فيه stack trace، و`instanceof Error` تشتغل.
- كتبت الـfield بشكل صريح مش `constructor(public statusCode: number)`. الاتنين شغالين، بس ده أوضح للمبتدئ ومش بيعتمد على feature في TS.
- `readonly`: زي `final` في Dart.

الاستخدام:
```ts
throw new AppError(404, "Order not found");
throw new AppError(409, `Order is already ${status}`);
```
**المقارنة بـDart:** ده `class ServerException implements Exception { final int statusCode; final String message; }` بالظبط.

---

## 6) الـerror handler المركزي
القاعدة: **تفرّق بين اللي إنت رميته واللي حصل غلط.**

```ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    // 1) لو الرد بدأ يتبعت خلاص، مينفعش نبعت تاني. نسيب Express يقفل الاتصال
    if (res.headersSent) {
        return next(err);
    }

    // 2) error إحنا رميناه: نرد بنفس الـstatus والرسالة
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ ok: false, error: err.message });
    }

    // 3) errors من مكتبات (زي JSON بايظ) فيها status من 4xx
    //    ... ركّبها إنت (انظر التمرين)

    // 4) أي حاجة تانية = bug عندنا: نسجّل الحقيقة، ونرد رد عام
    console.error("UNEXPECTED:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
}
```

### ليه كل حتة؟
- **`err: unknown`** مش `any`: افتكر نقطة المراجعة، `unknown` بتجبرك تتأكد من النوع (`instanceof`) قبل ما تستخدمه. ورأينا `throw "string"`، فالافتراض ده في مكانه.
- **`res.headersSent`**: لو الـhandler ابتدأ يبعت الرد وبعدين رمى، ومحاولتك تبعت رد تاني هتعمل `ERR_HTTP_HEADERS_SENT`. الحل المعروف: `next(err)`.
- **الـ500 رد عام**: اللي بيحصل (`err.message` و`stack`) بيتسجّل عندك بس. **أبدًا ما ترجّعه للعميل**: ممكن يبقى فيه اسم جدول أو مسار أو query.
- **الأربع parameters** حتى لو `next` مش مستخدمة في معظم الحالات (الفقرة 1).

### الأخطاء اللي بتيجي من المكتبات
`express.json()` بيرمي errors فيها `status` و`type`. جربتها:

| الحالة | `err.status` | `err.type` | الناتج المناسب |
| --- | --- | --- | --- |
| JSON بايظ | `400` | `entity.parse.failed` | `400` |
| body أكبر من الحد (100kb) | `413` | `entity.too.large` | `413` |

يعني الـhandler لازم يفحص `err.status` (أو `err.statusCode`) لو رقم بين 400 و499 ويرد بيه، وإلا الـclient غلطان هيشوف 500 وكأن السيرفر هو اللي وقع، وده يضلل أي monitoring.
(فكر: تنفع ترجّع `err.message` بتاعها؟ ولا ترجّع رسالة عامة؟ شوف الفقرة اللي فاتت.)

---

## 7) الـ404 كـerror
بدل ما `app.ts` فيه middleware بيرد `404` بنفسه، خلّيه يرمي:
```ts
app.use((req, res, next) => {
    next(new AppError(404, `Cannot ${req.method} ${req.path}`));
});
```
جربتها (`GET /nope`) ورجعت `{"ok":false,"error":"Cannot GET /nope"}` بـ`404`. الفايدة: الشكل واحد، والـlogging واحد، والـhandler هو المكان الوحيد اللي بيبني الرد.

### الترتيب في `app.ts` (مهم)
```
1. helmet / cors / morgan / express.json
2. الـroutes
3. الـ404 (بيرمي AppError)
4. errorHandler            ← دايمًا آخر حاجة
```
لو حطيت `errorHandler` **قبل** الـroutes، مش هيمسك errors الـroutes اللي بعده. نفس قاعدة الترتيب من درس 02.

---

## 8) أخطاء شائعة
1. **`res.status(500).json(err)`** جوه كل handler: بيرجّع الـerror object للعميل، ومفيش مكان مركزي.
2. **`try/catch` حوالين كل handler في Express 5:** مش لازم. بيزوّد كود من غير فايدة، ولو عملت `catch` وسكّت، الـerror بيختفي.
3. **ترمي `string` أو `object`:** `throw "not found"`. مفيش stack ومفيش `instanceof`. ارمي `Error` دايمًا.
4. **بعد `res.json(...)` تكمّل كود في نفس الـhandler:** من غير `return`، ممكن يرد مرتين. (إنت بتعمل `return res...` فعلًا، كمّل كده.)
5. **`throw` جوه `setTimeout` أو event listener:** Express مش هيمسكه (فقرة 3).
6. **نسيان `NODE_ENV=production` في السيرفر الحقيقي:** بيفعّل default handler الـdevelopment (فقرة 4)، وكمان بيأثر على مكتبات تانية.

---

## ✍️ التمرين (بإيدك)
كمّل على `phase-2-express`. القاعدة زي ما هي: **إنت اللي بتكتب**، وأنا أدّيك hints.

### 0) تصليح من المراجعة اللي فاتت
فحص الـid في `GET` و`PATCH` و`DELETE` على `/:id` بـ`Number.isNaN` بيقبل `2e0` و`0x2` و`" 2 "`. غيّره بحيث الـid لازم يبقى integer. 💡 إنت استخدمت الدالة الصح في الـpagination.

### أ) `AppError`
اعمل `src/errors/app-error.ts` بالشكل اللي في الفقرة 5 (اكتبه بإيدك، متنسخش).

### ب) الـerror handler
اعمل `src/middlewares/error-handler.ts`. لازم يغطي:
1. `res.headersSent`
2. `AppError` ← نفس الـstatus والرسالة
3. أي error مكتبة فيه `status` رقم من 400 لـ499 ← نفس الـstatus، ورسالة عامة (مش `err.message`)
4. أي حاجة تانية ← `console.error` و`500` ورد عام

💡 لـ(3): `err` من نوع `unknown`. هتحتاج تفحص إنه object وفيه `status` رقم قبل ما تستخدمه. جرّب تكتبها أول بـ`as` وشوف ليه مش أحسن حل.

### ج) ركّبه في `app.ts`
- الـ404 يبقى `next(new AppError(404, ...))`.
- `errorHandler` آخر حاجة.
- شيل الـ`import { logger }` اللي مش مستخدم (أو استخدمه).

### د) حوّل الـrouter
في `orders.router.ts` حوّل **كل** `return res.status(4xx).json(...)` لـ`throw new AppError(...)`. الـ`201` والـ`200` يفضلوا زي ما هم.
💡 لما تخلّص، الـ`GET /:id` المفروض يبقى أقصر بشكل واضح.

### هـ) اختبر بـ`curl`
جرّب كل حاجة قبل التحويل وبعده، لازم النتيجة تفضل **نفسها**:
```bash
curl -i http://localhost:3000/api/v1/orders/abc
curl -i http://localhost:3000/api/v1/orders/99
curl -i http://localhost:3000/nope
```
وحاجتين جداد:
```bash
curl -i -X POST http://localhost:3000/api/v1/orders -H "x-api-key: dev-secret-123" -H "Content-Type: application/json" -d '{bad'
```
(المفروض `400` JSON، مش HTML فيه stack.)

### و) اكسره عن قصد
1. ضيف مؤقتًا route `GET /boom` بيرمي `new Error("secret")`. المفروض الرد `500` عام، و`secret` يظهر في الـterminal بس.
2. خليه `async` وشوف إنه نفس النتيجة (Express 5).
3. حط `throw` جوه `setTimeout` وشوف السيرفر وقع. ورجّع الكود بعد ما تخلّص.

(على Windows: `curl.exe`، والـJSON جوه `-d` محتاج `\"` زي الدرس 02.)

ولما تخلّص قول **"راجع تمرين express 04"**.

---

## ❓ أسئلة المراجعة (جاوب بكلامك)
1. Express بيعرف إن الـfunction دي error handler إزاي؟ وإيه اللي يحصل لو كتبت 3 parameters بس؟
2. ليه الـerror handler لازم يكون آخر حاجة في `app.ts`؟
3. إيه الفرق بين `AppError` و bug عادي؟ وليه بنرد على كل واحد بشكل مختلف؟
4. في Express 4 الـasync handler اللي بيرمي error بيعمل إيه؟ وفي Express 5؟ وإيه الحاجة اللي Express 5 **لسه** مش بيمسكها؟
5. ليه مش بنرجّع `err.message` للعميل في الـ500؟
6. إيه فايدة `res.headersSent`؟ وإيه اللي كان هيحصل من غيرها؟
7. JSON بايظ جه من العميل. إيه الـstatus code الصح؟ وليه مش `500`؟
