# المرحلة 2 — الدرس 02: الـMiddleware

> **الهدف:** تفهم الـmiddleware: إيه هو، وبيشتغل بأنهي ترتيب، و`next()` بتعمل إيه، وتكتب بنفسك logger وحماية بـAPI key، وتستخدم `morgan` و`cors` و`helmet`.
> **الوقت المتوقع:** ساعة ونص.
> **خبر حلو:** إنت شفت الفكرة دي في salla: الـroute اللي واخد 4 functions ورا بعض. وفي Flutter هي نفس فكرة الـ**interceptors** في Dio.

> كل الأمثلة **اتجربت فعلًا** على Express 5.3.0.

---

## 1) الـMiddleware يعني إيه؟
function بتقف في **نص الطريق** بين وصول الـrequest والـhandler. وليها 3 اختيارات:

| الاختيار | بتعمله إزاي | مثال |
| --- | --- | --- |
| **تكمّل** | `next()` | "الـtoken سليم، عدّي" |
| **توقف وترد** | `res.status(...).json(...)` من غير `next()` | "مافيش token" ← `401` |
| **تعدّل وتكمّل** | تحط حاجة على `req` وبعدين `next()` | تحط `req.user` أو `req.requestId` |

```ts
import type { Request, Response, NextFunction } from "express";

function myMiddleware(req: Request, res: Response, next: NextFunction) {
  // اعمل حاجة...
  next();   // ← عدّي على اللي بعدي
}
```
**الفرق الوحيد بينها وبين الـhandler العادي:** الـparameter التالت `next`.

### المقارنة بـDio
| Dio (Flutter) | Express |
| --- | --- |
| `Interceptor` | middleware |
| `handler.next(options)` | `next()` |
| `handler.reject(...)` | `res.status(401).json(...)` من غير `next()` |
| `options.headers["Authorization"] = ...` | `req.user = ...` |
| `dio.interceptors.add(...)` | `app.use(...)` |

---

## 2) الترتيب هو كل حاجة
Express بيمشي على الـmiddlewares **بالترتيب اللي كتبتها بيه**، زي الطابور. وإنت شفت ده بعينك في الـ404 في الدرس 01.

### تجربة: إمتى كل حاجة بتشتغل
```ts
app.use((req, res, next) => {
  log("1 before next");
  res.on("finish", () => log(`5 finished ${res.statusCode}`));
  next();
  log("4 after next");
});

function requireApiKey(req, res, next) {
  log("2 requireApiKey");
  if (req.headers["x-api-key"] !== "secret") {
    res.status(401).json({ error: "missing or wrong api key" });
    return;                          // ← وقف هنا، من غير next()
  }
  next();
}

app.get("/private", requireApiKey, (req, res) => {
  log("3 handler");
  res.json({ ok: true });
});
```
**النتيجة الحقيقية:**
| الطلب | الترتيب |
| --- | --- |
| `/private` **بالـkey** | `1` ← `2` ← `3` ← `4` ← `5 finished 200` |
| `/private` **من غير key** | `1` ← `2` ← `4` ← `5 finished 401` (الـhandler **ماشتغلش**) |

**لاحظ حاجتين:**
- لما `requireApiKey` ردّت ومانادتش `next()`، الـhandler (`3`) **عمره ما اشتغل**. ده بالظبط اللي بيحمي الـroute.
- `res.on("finish")` بيشتغل **بعد ما الرد يتبعت فعلًا**، وده المكان الصح لو عايز تحسب الوقت أو تكتب log فيه الـstatus.

> ⚠️ ماتعتمدش على الكود اللي **بعد** `next()` (السطر `4`). هنا اشتغل بعد الـhandler لأن الـhandler كان sync. لكن لو الـhandler فيه `await`، السطر `4` هيشتغل **قبله**. فاستخدم `res.on("finish")` دايمًا.

---

## 3) الـ3 مستويات
```ts
// 1) app-level: على كل الـrequests
app.use(logger);

// 2) router-level: على كل routes الـrouter ده بس
ordersRouter.use(requireApiKey);

// 3) route-level: على route واحد بس
ordersRouter.post("/", requireApiKey, createOrder);
```
| المستوى | بيشتغل على | مثال |
| --- | --- | --- |
| app | كل حاجة | logger، و`express.json()`، و`cors`، و`helmet` |
| router | كل حاجة جوه `/api/v1/orders` | "لازم تكون مسجّل دخول عشان تشوف الأوردرات" |
| route | route واحد | "لازم تكون **admin** عشان تمسح" |

> 🔍 **في salla:** `protectRoutes` و`allowedTo` و`validation` كلهم **route-level**، ومتكررين في كل route. لو كل الـroutes في الملف محتاجين `protectRoutes`، كان ممكن يتكتب مرة واحدة: `orderRouter.use(protectRoutes(...))`.

---

## 4) ⚠️ لو نسيت `next()` ونسيت ترد
```ts
app.get("/hang", (req, res, next) => {
  // مافيش next() ومافيش res.json()
});
```
**النتيجة:** الـrequest **بيفضل معلّق**. جربتها، والعميل استنى لحد ما وقفته أنا بعد 1.5 ثانية (`TimeoutError`)، والسيرفر عمره ما رد.
وفي Flutter هتشوف ده كـloading مابيخلصش، أو `DioException` نوعها timeout.

**القاعدة:** كل middleware لازم يعمل **واحدة من الاتنين**: `next()` **أو** يرد.

---

## 5) تضيف حاجة على `req`
مثلًا: كل request ياخد رقم مميز، عشان لو حصلت مشكلة تلاقيه في الـlogs:
```ts
import { randomUUID } from "node:crypto";

app.use((req, res, next) => {
  req.requestId = randomUUID();          // ← ❌ TS هيقول: Property 'requestId' does not exist
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
```
TypeScript مايعرفش إن `req` فيها `requestId`. فلازم تقوله، مرة واحدة في المشروع كله:
```ts
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
export {};
```
ده اسمه **declaration merging**: إنت بتضيف field على الـinterface الموجود في Express. (جربته، والـtypecheck عدّى.)
> 💡 وده نفس اللي هنعمله في المرحلة 5 مع `req.user` بعد الـlogin.

---

## 6) Middlewares جاهزة
```bash
npm install morgan cors helmet
```
```bash
npm install -D @types/morgan @types/cors
```
(`helmet` جاي بالـtypes بتاعته.)

```ts
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(morgan("dev"));
```
| الـpackage | بيعمل إيه | اللي شفته في التجربة |
| --- | --- | --- |
| **`morgan`** | يطبع سطر لكل request | `GET /private 401 0.215 ms - 36` |
| **`cors`** | يسمح لمواقع معينة تكلّم الـAPI **من المتصفح** | `access-control-allow-origin: http://localhost:5173` |
| **`helmet`** | يحط headers أمان جاهزة | `x-content-type-options: nosniff` |

### `cors` ده بيأثر على Flutter؟
- **تطبيق موبايل:** **لأ.** الـCORS حاجة في المتصفحات بس.
- **Flutter Web، أو Dashboard:** **أيوه.** المتصفح هيرفض الرد لو الـorigin بتاعك مش مسموح.

> 🔍 **في salla:** `app.use(cors())` من غير أي إعدادات، يعني **أي موقع** يقدر يكلّم الـAPI من المتصفح. ده مقبول في الـdevelopment، بس في الـproduction الأحسن تحدد الـdashboards بتاعتكم بس.

---

## 7) Middleware بيرمي error
```ts
app.get("/throws", () => {
  throw new Error("boom in handler");
});
// النتيجة: 500، وصفحة HTML فيها الـstack trace
```
Express مسك الـerror ورد بـ`500`، بس **بصفحة HTML** فيها تفاصيل الكود الداخلية. وده اللي هنصلّحه في **الدرس 04** بالـerror middleware.

---

## ✍️ التمرين (بإيدك)
كمّل على مشروعك `phase-2-express`:

### أ) Logger بإيدك (`src/middlewares/logger.ts`)
- بيطبع سطر لكل request، بالشكل ده: `GET /api/v1/orders 200 3ms`
- 💡 الـstatus والوقت مش هتعرفهم غير بعد الرد، فاستخدم `res.on("finish", ...)`.
- ركّبه app-level.
- **جرّب:** حطه **تحت** الـ`ordersRouter` بدل فوقه. إيه اللي اتغيّر؟ وليه؟ وبعدين رجّعه.

### ب) Request ID (`src/middlewares/request-id.ts`)
- يدّي كل request `requestId` بـ`randomUUID()`، ويحطه في header اسمه `X-Request-Id`.
- اعمل `src/types/express.d.ts` زي قسم 5، عشان الـtypecheck يعدّي.
- خلي الـlogger يطبع الـid كمان.

### ج) حماية بـAPI key (`src/middlewares/require-api-key.ts`)
- لو header `x-api-key` مش بيساوي قيمة من `process.env.API_KEY` ← `401`.
- ركّبه **route-level** على `POST /api/v1/orders` بس. يعني أي حد يقدر **يشوف** الأوردرات، بس **الإضافة** محتاجة key.
- شغّل بـ`--env-file=.env` زي الدرس 07، وماتنساش `.env.example`.

### د) الجاهزين
- ركّب `helmet` و`cors` و`morgan("dev")`.
- قارن السطر بتاع `morgan` بالسطر بتاع الـlogger بتاعك.

**جرّب POST** من PowerShell:
```powershell
curl.exe -i -X POST http://localhost:3000/api/v1/orders -H "Content-Type: application/json" -H "x-api-key: secret" -d '{\"customerId\": 13, \"total\": 75}'
```
(الـ`-i` بتطبع الـheaders كمان، فهتشوف `X-Request-Id`.)

ولما تخلّص قول **"راجع تمرين express 02"**.

---

## ❓ أسئلة مراجعة
1. إيه هو الـmiddleware؟ وإيه الـ3 حاجات اللي ممكن يعملها؟
2. إيه اللي بيحصل لو middleware مانادتش `next()` ومردتش؟
3. إيه الفرق بين app-level وrouter-level وroute-level؟ واديني مثال لكل واحد من API أوردرات.
4. ليه الـlogger بيستخدم `res.on("finish")` بدل ما يطبع بعد `next()`؟
5. إزاي تضيف `req.requestId` من غير ما TypeScript يزعق؟
6. `cors` بيأثر على تطبيق Flutter موبايل؟ وعلى Flutter Web؟
7. في salla، `protectRoutes` متكررة في كل route. إزاي ممكن تتكتب مرة واحدة؟

---

## 📚 مصادر
- [Express — Using middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Express — Writing middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [MDN — CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [helmet](https://helmetjs.github.io/)
