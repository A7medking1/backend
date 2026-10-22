# المرحلة 2 — الدرس 01: أول سيرفر Express

> **الهدف:** تعمل سيرفر Express، وتفهم الـrouting والـparams والـquery والـbody، وتقسّم الـroutes على `Router`، وتعرف تقرا كود Express 4 القديم.
> **الوقت المتوقع:** ساعتين.
> **خبر حلو:** إنت عملت سيرفر بـ`node:http` بإيدك في الدرس 06. Express هو **نفس الحاجة بالظبط**، بس بيوفّر عليك الـ`if` الكتير والـ`JSON.parse` والـ`writeHead`.

> كل الأمثلة **اتجربت فعلًا** على Express 5.3.0 وNode v24.14.0.

---

## 1) خريطة المرحلة 2
| الدرس | الموضوع |
| --- | --- |
| **01** | **أساسيات Express: routes وparams وquery وbody وRouter** ← إنت هنا |
| 02 | الـMiddleware: الترتيب و`next()` (زي الـinterceptors في Dio) |
| 03 | REST: إزاي تسمّي الـroutes، والـstatus codes الصح |
| 04 | الـErrors: الـerror middleware، و`AppError`، وExpress 5 vs 4 |
| 05 | الـValidation بـZod |
| 06 | التقسيم: routes ← controllers ← services، والمشروع الصغير (Todo API) |

---

## 2) من `node:http` لـExpress
**قبل (الدرس 06):**
```ts
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  // ... if تانية لكل route
});
server.listen(3000);
```
**بعد (Express):**
```ts
import express from "express";

const app = express();
app.use(express.json());          // ← بدل readBody و JSON.parse

app.get("/health", (req, res) => {
  res.json({ ok: true });         // ← بدل writeHead و JSON.stringify و end
});

app.listen(3000, () => console.log("http://localhost:3000"));
```
**Express مش سحر:** جوه `app.listen` فيه `http.createServer(app)`. يعني `app` نفسه هو الـfunction اللي `createServer` بياخدها.

### التنصيب
```bash
npm install express
```
```bash
npm install -D @types/express
```
- `express` في `dependencies`، لأن السيرفر محتاجه وهو شغال.
- `@types/express` في `devDependencies`، لأنها types بس (الدرس 03).

---

## 3) الـRouting
```ts
app.get("/orders", handler);        // GET    /orders
app.post("/orders", handler);       // POST   /orders
app.get("/orders/:id", handler);    // GET    /orders/5
app.patch("/orders/:id", handler);  // PATCH  /orders/5
app.delete("/orders/:id", handler); // DELETE /orders/5
```
Express بيدوّر على الـroutes **بالترتيب من فوق لتحت**، وأول واحد يطابق هو اللي بيشتغل. (وده هيفرق جدًا في الدرس 02.)

---

## 4) الـ3 أماكن اللي الداتا بتيجي منها
| | مثال | في Express | النوع |
| --- | --- | --- | --- |
| **params** | `/orders/5` | `req.params.id` | `string` دايمًا |
| **query** | `/orders?status=pending` | `req.query.status` | `string` أو مش موجود |
| **body** | `{"total": 75}` في `POST` | `req.body` | أي حاجة، **ماتثقش فيها** |

```ts
app.get("/orders/:id", (req, res) => {
  const id = req.params.id;       // "5"  ← string مش رقم!
  res.json({ id, query: req.query });
});
// GET /orders/5?x=1
// {"id":"5","query":{"x":"1"}}
```
> ⚠️ `req.params.id` **دايمًا string**، زي `process.env` بالظبط (الدرس 07). فلو محتاج رقم: `Number(req.params.id)`، واتأكد إنه مش `NaN`.

### الـbody
```ts
app.post("/orders", (req, res) => {
  const body: unknown = req.body;   // ← unknown، فاكر الدرس 02؟
  res.status(201).json({ got: body });
});
```
النتايج الحقيقية:
| الطلب | النتيجة |
| --- | --- |
| JSON صح، ومعاه `Content-Type: application/json` | `201 {"got":{"total":75}}` |
| JSON بايظ | `400`، وصفحة HTML فيها الـerror (هنصلّحها في الدرس 04) |
| JSON صح، بس **من غير** `Content-Type` | `req.body` بيبقى **`undefined`** 😱 |

> ⚠️ `express.json()` بيقرا الـbody **بس** لو الـheader بيقول `application/json`. فلو الـbody طلع `undefined` وأنت متأكد إنك باعته، أول حاجة تبص عليها هي الـheader. وفي Flutter، `Dio` بيحطه لوحده، بس لو بتستخدم `http` لازم تحطه بإيدك.

### `req.body` vs `unknown`
`@types/express` بيقول إن `req.body` نوعها `any`. وده كدب، لأن العميل ممكن يبعت أي حاجة. فخليها `unknown`، واتأكد منها. وفي الدرس 05 هنعمل ده بـZod في سطر واحد.

---

## 5) الـResponse
```ts
res.json({ ok: true });                   // 200 + JSON
res.status(201).json(order);              // status معين + JSON
res.status(204).end();                    // مافيش body (زي بعد DELETE)
res.sendStatus(404);                      // status بس
```
> ⚠️ **رد واحد بس لكل request.** لو كتبت `res.json` مرتين، هيطلع error: `Cannot set headers after they are sent`. وعشان كده اكتب `return res.json(...)` لو فيه كود بعده.

---

## 6) `express.Router()`: تقسيم الـroutes
بدل ما كل الـroutes تبقى في ملف واحد، كل "حاجة" ليها router لوحدها:
```ts
// orders.router.ts
import { Router } from "express";

export const ordersRouter = Router();

ordersRouter.get("/", (req, res) => { /* كل الأوردرات */ });
ordersRouter.get("/:id", (req, res) => { /* أوردر واحد */ });
ordersRouter.post("/", (req, res) => { /* أوردر جديد */ });
```
```ts
// app.ts
import { ordersRouter } from "./orders.router.js";

app.use("/api/v1/orders", ordersRouter);
```
| جوه الـrouter | المسار الحقيقي |
| --- | --- |
| `"/"` | `/api/v1/orders` |
| `"/:id"` | `/api/v1/orders/5` |

**المقارنة بـFlutter:** شبه الـnested routes في `go_router`. الـrouter الصغير مايعرفش هو متركّب فين، والـ`app` هو اللي بيحدد.
> 🔍 وده بالظبط اللي salla عامله في `index.routes.js`: 25 router، كل واحد متركّب على `/api/v1/...`.

---

## 7) الـ404
لو مافيش route طابق، حط في **الآخر خالص** handler بيرد بـ404:
```ts
app.use((req, res) => {
  res.status(404).json({ error: "not found", path: req.originalUrl });
});
```
لازم يبقى **بعد** كل الـroutes، لأن Express بيمشي بالترتيب. ولو حطيته في الأول، كل حاجة هترجع 404.

---

## 8) ⚠️ Express 5 vs Express 4 (مهم لكود الشركة)
salla شغال **Express 4.21**، وإحنا هنتعلم **Express 5**. ودي الفروق اللي هتقابلك:

### أ) شكل الكود القديم (Express 4 + CommonJS)
```js
const express = require("express");
const router = express.Router();

router.get("/:id", function (req, res, next) {
  res.json({ id: req.params.id });
});

module.exports = router;
```
نفس المنطق بالظبط، الفرق في `require` و`module.exports` (الدرس 03) و`function` بدل arrow.

### ب) الـpaths اللي فيها `*` و`?` اتغيّرت
| Express 4 | Express 5 | اللي حصل لما جربت الشكل القديم على Express 5 |
| --- | --- | --- |
| `"*"` أو `"/*"` | `"/*splat"` | ❌ السيرفر **وقع وهو بيقوم**: `Missing parameter name at index 2: /*` |
| `"/:id?"` (اختياري) | `"/users{/:id}"` | ❌ وقع: `Unexpected ? at index 4` |

> 🔍 في salla: `app.all("/*", ...)` في `index.routes.js`. لو حد رقّى المشروع لـExpress 5 من غير ما يغيّر السطر ده، **السيرفر مش هيقوم أصلًا**. والحل الأبسط هو اللي في قسم 7: `app.use(...)` من غير path.

### ج) الـerrors بتاعة الـasync
```ts
app.get("/boom", async () => {
  await something();
  throw new Error("db down");
});
// Express 5: بيمسكها لوحده ويبعتها للـerror middleware  ← جربتها: 500 {"caught":"db down"}
// Express 4: الـrequest بيفضل معلّق، أو السيرفر بيقع     ← وعشان كده salla عامل catchAsyncError
```
(هنفصّل ده في الدرس 04.)

### د) حاجات صغيرة
| | Express 4 | Express 5 |
| --- | --- | --- |
| `req.body` لو `express.json()` ماقراش الـbody (مثلًا من غير `Content-Type`) | `{}` | `undefined` |
| `?a[b]=1` | `{ a: { b: "1" } }` | `{ "a[b]": "1" }` (جربتها) |
| `app.listen` لو الـport مشغول | السيرفر بيقع | الـerror بيوصل للـcallback: `listen EADDRINUSE` |

---

## ✍️ التمرين (بإيدك — من غير AI)
> ⚠️ **المرحلة 2 لسه بتاعتك:** إنت اللي بتكتب الكود، وأنا بشرح وأراجع.

### أ) جهّز المشروع (زي ما عملت في المرحلة 1)
1. اعمل فولدر `D:\backend\phase-2-express`، وجواه `npm init -y`.
2. في `package.json`: ضيف `"type": "module"`.
3. نزّل:
   ```bash
   npm install express
   ```
   ```bash
   npm install -D typescript@~6.0.3 tsx @types/node@24 @types/express
   ```
4. انسخ `tsconfig.json` و`eslint.config.js` من `phase-1-node-ts`، ونزّل أدوات ESLint وPrettier زي الدرس 07.
5. ضيف scripts: `dev` (بـ`tsx watch src/app.ts`)، و`typecheck`، و`lint`.

### ب) Orders API (`src/`)
خلي الأوردرات **array في الـmemory** (من غير ملفات ولا داتابيز):
```ts
const orders = [
  { id: 1, customerId: 10, status: "delivered", total: 250 },
  { id: 2, customerId: 11, status: "pending", total: 120 },
];
```
| Route | المطلوب |
| --- | --- |
| `GET /health` | `200 {"ok": true}` |
| `GET /api/v1/orders` | كل الأوردرات. ولو فيه `?status=pending` فلتر |
| `GET /api/v1/orders/:id` | أوردر واحد. ولو مش موجود ← `404`. ولو `id` مش رقم ← `400` |
| `POST /api/v1/orders` | ياخد `{ customerId, total }`، يتأكد منهم (زي الدرس 06)، ويرجّع `201` |
| أي حاجة تانية | `404 {"error": "not found"}` |

القواعد:
- الـroutes بتاعة الأوردرات في `src/orders.router.ts` بـ`Router()`، ومتركّبة في `src/app.ts` على `/api/v1/orders`.
- `req.body` يتعامل كـ`unknown`.
- الـ404 في الآخر.

جرّب بـPostman أو Thunder Client (extension في VS Code)، أو بـ`client.ts` بـ`fetch` زي الدرس 06.

### ج) اقرا salla
افتح `src/routers/order.router.js` في salla، واكتب:
1. إيه اللي هيتغير لو اتكتب بـESM وExpress 5؟
2. الـroute اللي اسمه `/updateAll`: إيه المشكلة فيه؟ (💡 فاكر أول مرة بصينا على salla؟)

ولما تخلّص قول **"راجع تمرين express 01"**.

---

## ❓ أسئلة مراجعة
1. إيه علاقة Express بـ`node:http`؟
2. إيه الفرق بين `req.params` و`req.query` و`req.body`؟ اديني مثال لكل واحد من API أوردرات.
3. ليه `req.params.id` محتاج `Number()`؟
4. `req.body` طلع `undefined` رغم إنك باعت JSON. إيه أول حاجتين تتأكد منهم؟
5. ليه الـ404 handler لازم يبقى آخر حاجة؟
6. لو `app.use("/api/v1/orders", router)` وجوه الـrouter `router.get("/:id")`، المسار الكامل إيه؟
7. اذكر 3 فروق بين Express 4 وExpress 5 ممكن تكسر كود salla لو اترقّى.

---

## ✅ إجابات أسئلة المراجعة
> الـAgent جاوبها بطلبي (2026-10-22). **التمرين نفسه أنا اللي كتبته بإيدي.**

#### 1. علاقة Express بـ`node:http`؟
Express **مبني فوق** `node:http`. جوه `app.listen` فيه `http.createServer(app)`، يعني `app` نفسه هو الـfunction اللي السيرفر بينادي عليها مع كل request. وExpress بيضيف فوقها أدوات: الـrouting، و`express.json()`، و`res.json()`.

#### 2. `req.params` vs `req.query` vs `req.body`
| | فين | مثال من الأوردرات |
| --- | --- | --- |
| `req.params` | جوه المسار نفسه | `/orders/5` ← `req.params.id` = `"5"` |
| `req.query` | بعد علامة `?` | `/orders?status=pending` ← `req.query.status` |
| `req.body` | جسم الطلب (في `POST` و`PATCH`) | `{ "customerId": 13, "total": 75 }` |

#### 3. ليه `req.params.id` محتاج `Number()`؟
لأن أي حاجة في الرابط بتوصل **نص** (`"5"` مش `5`). فلو قارنتها بـ`o.id === "5"` و`o.id` رقم، عمرها ما هتطابق. وبعد `Number()` لازم تتأكد إنها مش `NaN`، لأن `Number("abc")` مابترميش error.

#### 4. `req.body` طلع `undefined`؟
1. **الـheader:** هل الطلب فيه `Content-Type: application/json`؟ من غيره `express.json()` مش هيقرا الـbody.
2. **`app.use(express.json())`:** موجودة؟ وموجودة **قبل** الـroutes؟

#### 5. ليه الـ404 لازم آخر حاجة؟
Express بيجرّب الـroutes **بالترتيب من فوق لتحت**، و`app.use` من غير path بيطابق **أي** request. فلو اتحط فوق، هيمسك كل حاجة قبل ما توصل للـroutes الحقيقية، وكل حاجة هترجع 404 (وده حصل فعلًا في التمرين).

#### 6. المسار الكامل؟
`/api/v1/orders/:id`، يعني مثلًا `/api/v1/orders/5`. الـ`app.use` بيحط الأول، والـrouter بيكمّل.

#### 7. فرق بين Express 4 و5
- `"*"` و`"/*"` في المسارات **بتوقّع السيرفر** في Express 5، والشكل الجديد `"/*splat"`.
- الـerrors في الـasync handlers: Express 5 بيمسكها لوحده، وExpress 4 محتاج wrapper زي `catchAsyncError`.
- `req.body` لو مااتقراش: `{}` في 4، و`undefined` في 5.

---

## 📚 مصادر
- [Express — Hello world](https://expressjs.com/en/starter/hello-world.html)
- [Express — Routing](https://expressjs.com/en/guide/routing.html)
- [Express — Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html) ← **مهم لكود الشركة**
- [Express 5 API — req / res](https://expressjs.com/en/5x/api.html)
