# المرحلة 2 — الدرس 03: REST

> **الهدف:** تصمّم API "صح": تختار الـmethod المناسب، وتسمّي الـroutes كأسماء مش أفعال، وترجّع الـstatus code الصح لكل حالة، وتفهم ليه `/api/v1`.
> **الوقت المتوقع:** ساعة ونص.
> **خبر حلو:** إنت بتستهلك APIs من Flutter بقالك سنين. الدرس ده هو نفس الحاجة بس من الناحية التانية. وهنحلّل endpoints **salla الحقيقية** من `api_constant.dart` في تطبيقك.

> كل أمثلة الـExpress **اتجربت فعلًا** على Express 5.3.0.

---

## 1) REST يعني إيه؟
فكرة واحدة: الـURL بيقول **"على إيه"** (اسم = resource)، والـmethod بيقول **"هتعمل إيه"** (فعل).

```
GET    /api/v1/orders        ← هات كل الأوردرات
GET    /api/v1/orders/5      ← هات أوردر 5
POST   /api/v1/orders        ← اعمل أوردر جديد
PATCH  /api/v1/orders/5      ← عدّل حتة من أوردر 5
PUT    /api/v1/orders/5      ← استبدل أوردر 5 كله
DELETE /api/v1/orders/5      ← امسح أوردر 5
```
لاحظ: الـURL **هو هو** (`/orders/5`)، واللي بيتغير الـmethod بس.

### المقارنة بـFlutter
ده بالظبط شكل الـ**Repository** اللي بتكتبه:
| Repository في Dart | REST |
| --- | --- |
| `getOrders()` | `GET /orders` |
| `getOrder(id)` | `GET /orders/:id` |
| `createOrder(params)` | `POST /orders` |
| `updateOrder(id, params)` | `PATCH /orders/:id` |
| `deleteOrder(id)` | `DELETE /orders/:id` |

الفرق إن في Dart اسم الـfunction فيه الفعل (`get`، `create`). في REST الفعل **مكانه الـmethod**، مش الـURL.

---

## 2) الـMethods: آمن ولا لأ؟ ينفع يتكرر ولا لأ؟
| Method | بيعمل إيه | **safe**؟ (مابيغيّرش حاجة) | **idempotent**؟ (لو اتبعت مرتين، النتيجة زي مرة) |
| --- | --- | --- | --- |
| `GET` | يقرا | ✅ | ✅ |
| `POST` | يعمل جديد | ❌ | ❌ ← مرتين = **أوردرين** |
| `PUT` | يستبدل الحاجة كلها | ❌ | ✅ |
| `PATCH` | يعدّل حتة | ❌ | ⚠️ غالبًا (حسب العملية) |
| `DELETE` | يمسح | ❌ | ✅ |

### ليه "idempotent" تهمّك كمطور Flutter؟
تخيّل retry interceptor في Dio: النت قطع بعد ما الطلب وصل للسيرفر، والتطبيق عمل retry.
- لو الطلب `PUT /users/me` بنفس الداتا: مفيش مشكلة، النتيجة واحدة.
- لو الطلب `POST /orders`: **العميل اتعمله أوردرين، واتحاسب مرتين.** 💸

عشان كده الـretry الأوتوماتيك يتعمل على الـmethods الـidempotent بس.

> 💡 `DELETE` مرتين: المرة الأولى `204`، والتانية `404`. الرد اختلف، بس **حالة السيرفر** واحدة (الأوردر ممسوح). وده اللي idempotent بتتكلم عنه.

### `PUT` vs `PATCH`
```
الأوردر دلوقتي: { customerId: 10, status: "pending", total: 250 }

PATCH /orders/1   { "status": "delivered" }
→ { customerId: 10, status: "delivered", total: 250 }        ← الباقي زي ما هو

PUT /orders/1     { "status": "delivered" }
→ { status: "delivered" }                                    ← استبدل كله، فالباقي راح
```
في الواقع **`PATCH` هو اللي هتستخدمه أغلب الوقت**. والـ`PUT` لما العميل بيبعت الحاجة كاملة.

> 🔍 **في salla:** تعديل البروفايل `PUT users` مع `params.toJson()`. لو الـparams دي فيها كام field بس (الاسم مثلًا)، يبقى المقصود `PATCH`.

---

## 3) تسمية الـroutes
### القواعد
1. **أسماء، مش أفعال:** `/orders` مش `/getOrders`.
2. **جمع:** `/orders/5` مش `/order/5`.
3. **حروف صغيرة، والكلمات بـ`-`:** `/merchant-requests` مش `/merchantRequests`.
4. **العلاقات بالتداخل، مستوى واحد بس:** `/merchants/7/reviews` (تقييمات التاجر 7).
5. **الفلترة والترتيب والصفحات في الـquery:** `/orders?status=pending&page=2`، مش `/orders/pending/page/2`.
6. **"أنا" = `me`:** `/users/me` بدل ما العميل يبعت الـid بتاعه.

### salla تحت الميكروسكوب 🔍
ده من `lib/src/core/api/api_constant.dart` في `salla_user`، مع الـmethod اللي التطبيق بيستخدمه فعلًا:

| salla دلوقتي | المشكلة | REST |
| --- | --- | --- |
| `GET orders`، `GET products`، `GET addresses` | ✅ مفيش | زي ما هي |
| `GET users/getProfile` | فعل (`get`) في الـURL، والـmethod أصلًا `GET` | `GET /users/me` |
| `PUT users` (تعديل البروفايل) | مش واضح مين، وغالبًا `PATCH` | `PATCH /users/me` |
| `POST reviews/addReviewToMerchant` | فعل + العلاقة في الاسم | `POST /merchants/:id/reviews` |
| `PUT orders/merchantCancelOrder/:id` | **الدور** (`merchant`) والفعل في الـURL | `POST /orders/:id/cancel` |
| `PUT orders/driverAcceptOrder/:id` | نفس المشكلة | `POST /orders/:id/accept` |

### طب الـactions زي "accept" و"cancel"؟
دي المنطقة الرمادية في REST. فيه حلّين مقبولين:
```
PATCH /orders/5         { "status": "cancelled" }     ← تعديل state
POST  /orders/5/cancel  { "reason": "..." }           ← action صريح
```
التاني أوضح لما الـaction فيه منطق كتير (رجوع فلوس، إشعارات للسواق، سبب إلغاء). وده مقبول.

**اللي مش مقبول:** إن **الدور** يبقى في الـURL (`merchantCancelOrder` و`userUpdateOrder` و`driverUpdateOrder`). السيرفر **عارف إنت مين من الـtoken** (`req.user` في المرحلة 5). فالـendpoint يبقى واحد، وجوّاه:
```ts
if (req.user.role === "merchant") { ... }
```
لو الدور في الـURL، أي حد يقدر يجرّب `merchantCancelOrder` حتى لو مش تاجر، والأمان كله بقى معتمد إن كل route فاكر يتأكد.

> 🔍 وفاكر `/updateAll` من الدرس 01؟ نفس الفكرة: فعل في الـURL، ومن غير حماية.

---

## 4) الـStatus Codes: الـ10 اللي في الـCheckpoint
### المجموعات
| يبدأ بـ | معناه | مين الغلطان |
| --- | --- | --- |
| `2xx` | تمام | محدش |
| `4xx` | الطلب فيه مشكلة | **العميل** |
| `5xx` | السيرفر وقع | **إحنا** |

### الـ10 على API الأوردرات
| Code | الاسم | إمتى | مثال |
| --- | --- | --- | --- |
| `200` | OK | نجح وفيه رد | `GET /orders/1`، `PATCH /orders/1` |
| `201` | Created | اتعمل حاجة جديدة | `POST /orders` (+ header `Location`) |
| `204` | No Content | نجح ومفيش رد | `DELETE /orders/1` |
| `400` | Bad Request | مش قادر أفهم الطلب | JSON بايظ، `id` = `"abc"`، `?page=-1` |
| `401` | Unauthorized | **مش عارفينك** | مفيش `x-api-key` أو غلط (إنت عملتها!) |
| `403` | Forbidden | **عارفينك، بس ممنوع** | عميل عادي بيحاول يمسح أوردر حد تاني |
| `404` | Not Found | مش موجود | `GET /orders/999` |
| `409` | Conflict | بيتعارض مع الحالة الحالية | إلغاء أوردر `delivered`، أو إيميل متسجّل قبل كده |
| `422` | Unprocessable Content | فهمت الطلب، بس الداتا مخالفة | `status: "flying"`، أو `total: -5` |
| `500` | Internal Server Error | bug عندنا | `undefined.x` جوه handler |

### الحالات اللي بتلخبط
**`401` vs `403`:** السؤال: "لو عمل login، هيعدّي؟" لو آه ← `401`. لو لأ، لإنه مش من حقه أصلًا ← `403`.

**`400` vs `422`:** في المشروع ده هنمشي على:
- `400` = **شكل** الطلب غلط (JSON مش مفهوم، `id` مش رقم، query غلط).
- `422` = الشكل تمام، بس **القيم** مخالفة للقواعد (status مش من المسموح، total سالب).

> ⚠️ شركات كتير بتستخدم `400` للاتنين، وده مش غلط. **المهم إنك تمشي على قاعدة واحدة في المشروع كله.** الكود بتاعك دلوقتي بيرجّع `400` لـ`total` السالب، وفي التمرين هنفصلهم.

**`404` vs `200` مع ليستة فاضية:**
```
GET /orders/999             ← 404 (حاجة واحدة مش موجودة)
GET /orders?status=flying   ← 200 و data: []  (الليستة موجودة، بس فاضية)
```

### ليه ماترجّعش `200` ومعاه `{ ok: false }`؟
Dio بيرمي `DioException` لأي status **مش `2xx`** (ده الـ`validateStatus` الافتراضي). فلو السيرفر رجّع `200` وفيه error:
- الـ`try/catch` في الـrepository **مش هيمسكه**.
- الـcubit هيفتكره نجاح، و`fromJson` هيقع على `data` الـ`null`.

الـstatus code الصح هو اللي بيخلّي الـerror handling في Flutter يشتغل لوحده.

### `201` مع `Location`
```ts
res.status(201).location(`/api/v1/orders/${order.id}`).json({ ok: true, data: order });
```
**النتيجة الحقيقية:** `201`، وheader `location: /api/v1/orders/5`. يعني "اتعمل، ومكانه هنا".

### `204` مابيبعتش body
```ts
res.status(204).json({ ok: true, msg: "will this be sent?" });
```
**النتيجة الحقيقية:** `204` والـbody **فاضي**. الـNode بيشيله لوحده، لإن `204` معناها "مفيش محتوى". فالأوضح:
```ts
res.status(204).end();
```

---

## 5) Express بيعمل إيه لوحده؟ (اتجرّب)
| الطلب | الرد | ليه |
| --- | --- | --- |
| `PUT /orders/5` ومفيش route لـ`PUT` | **`404`** | Express **مابيعملش `405`** لوحده. لو عايزها، تكتبها |
| `HEAD /orders` | `200` من غير body | Express بيستخدم الـ`GET` route لوحده |
| `OPTIONS /orders` | `200` و`Allow: GET, HEAD, POST` | Express بيقول الـmethods الموجودة |
| JSON بايظ (`{bad`) | **`400`، بس صفحة HTML فيها الـstack** | `express.json()` رمى error، والـerror handler الافتراضي رد بـHTML ← هنصلّحه في **الدرس 04** |

---

## 6) Express 5 vs Express 4: كود قديم بيكدب عليك ⚠️
كود Express 4 القديم ممكن يكون مكتوب كده. في Express 4 كان بيشتغل (مع تحذير deprecation)، **لكن في Express 5 النتيجة اتغيرت**:

| الكود | Express 4 | Express 5 (اتجرّب) |
| --- | --- | --- |
| `res.send(404)` | `404` و`Not Found` | **`200`** والـbody = `"404"` 😱 |
| `res.json({ ok: false }, 400)` | `400` | **`200`**، والـ`400` اتجاهلت |
| `res.status("201")` | `201` | **`TypeError`**: لازم integer |
| `res.status(1000)` | بيقع وقت الإرسال | **`RangeError`** على طول |

أول سطرين **أخطر حاجة**: مفيش crash ولا error، بس الـerror بقى نجاح، والـFlutter هيصدّقه.
**الصح في الاتنين:**
```ts
res.sendStatus(404);                          // → 404 و"Not Found"
res.status(400).json({ ok: false });          // → 400
```
> 🔍 لو قريت كود في الشركة فيه `res.send(رقم)` أو `res.json(obj, رقم)`، ده bug مستني حد يرقّي لـExpress 5.

---

## 7) ليه `/api/v1`؟
في الويب، لما تغيّر الـAPI، الكل بياخد النسخة الجديدة لما يعمل refresh.
**في الموبايل لأ.** فيه ناس فاتحة نسخة من التطبيق عمرها سنة، ومش هتعمل update.

لو غيّرت شكل الرد (مثلًا `result` بقت `data`)، كل النسخ القديمة هتقع. الحل:
```ts
app.use("/api/v1/orders", ordersRouterV1);   // النسخ القديمة شغالة عليه
app.use("/api/v2/orders", ordersRouterV2);   // النسخة الجديدة
```
**إمتى تعمل `v2`؟** لما التغيير **breaking** بس: شلت field، غيّرت اسمه أو نوعه، غيّرت معنى status code.
**مش محتاج `v2`:** لما تضيف field جديد، أو endpoint جديد. التطبيق القديم هيتجاهله عادي.

> 🔍 **في salla:** الـ`baseUrl` آخره `/api/v1/`، وفيه `app_version_manager_for_store.dart` بيجبر الناس تعمل update. الاتنين بيحلّوا نفس المشكلة من ناحيتين.

---

## 8) شكل الرد: ثابت في كل حتة
اختار شكل واحد ومتغيروش أبدًا. إحنا ماشيين على:
```jsonc
// نجاح
{ "ok": true, "data": { ... } }

// ليستة بصفحات
{ "ok": true, "data": [ ... ], "meta": { "page": 2, "limit": 10, "total": 37 } }

// error
{ "ok": false, "error": "Order not found" }
```
> 🔍 **في salla:** الرد بيتقري بـ`response.data['result']`، يعني هما اختاروا `result` بدل `data`. الاسم مش مهم، **الثبات** هو المهم. لو endpoint واحد رجّع `data` والباقي `result`، الـ`fromJson` هيقع.

---

## ✍️ التمرين (بإيدك)
كمّل على `phase-2-express`. والقاعدة لسه زي ما هي: **إنت اللي بتكتب**.

### 0) تنضيف من الدرس اللي فات
- في `app.ts`: الـ`import { logger }` مش مستخدم. يا تشيله، يا ترجّع `app.use(logger)` جنب `morgan`.
- خلّي `helmet()` أول middleware.

### أ) `POST` يرجّع `Location`
- زوّد header `Location` على الـ`201`.
- وافصل الـvalidation: `customerId` مش integer ← `400`. و`total` رقم بس `<= 0` ← `422`. و`total` مش رقم أصلًا ← `400`.

### ب) `PATCH /api/v1/orders/:id`: تغيير الـstatus
- محمي بالـAPI key (route-level، زي الـ`POST`).
- الـbody: `{ "status": "..." }`، والقيم المسموحة: `pending` و`delivered` و`cancelled`.
- الردود:

| الحالة | الرد |
| --- | --- |
| `id` مش رقم | `400` |
| الأوردر مش موجود | `404` |
| `status` مش من الـ3 | `422` |
| الأوردر حالته `delivered` أو `cancelled` (خلص خلاص) | `409` |
| كله تمام | `200` والأوردر بعد التعديل |

💡 فكّر: الترتيب بين الـchecks دي مهم؟ هل تتأكد من الـ`status` الأول ولا من وجود الأوردر الأول؟

### ج) `DELETE /api/v1/orders/:id`
- محمي بالـAPI key.
- `204` من غير body، أو `404`، أو `400` لو الـid مش رقم.
- 💡 هتمسح من الـarray إزاي؟ (`findIndex` + `splice`)

### د) Pagination على `GET /api/v1/orders`
- `?page=1&limit=10` (الافتراضي: `page=1` و`limit=10`).
- لو أي واحد فيهم مش integer موجب ← `400`.
- الرد: `{ ok: true, data: [...], meta: { page, limit, total } }`، والـ`total` بعد فلتر الـ`status`.
- 💡 `slice((page - 1) * limit, page * limit)`

### هـ) على الورق: صمّم salla من جديد
اعمل `phase-2-express/exercises/03-salla-rest.md`، واكتب الشكل الـREST لـ6 endpoints دول من `api_constant.dart`:
1. `users/changePassword`
2. `notificationsToOne/readAll`
3. `drivers/merchantAddDriver`
4. `orders/userAcceptNewPriceForOrder`
5. `reviews/updateReviewToDriver`
6. `merchantRequests/myRequest`

لكل واحد: الـmethod، والـURL، والـstatus code لو نجح.

### جرّب
```bash
curl -i -X PATCH http://localhost:3000/api/v1/orders/2 -H "Content-Type: application/json" -H "x-api-key: dev-secret-123" -d '{"status":"delivered"}'
```
```bash
curl -i -X DELETE http://localhost:3000/api/v1/orders/1 -H "x-api-key: dev-secret-123"
```
```bash
curl -i "http://localhost:3000/api/v1/orders?page=1&limit=1"
```
(على Windows: `curl.exe`، والـJSON جوه `-d` محتاج `\"` زي الدرس 02.)

ولما تخلّص قول **"راجع تمرين express 03"**.

---

## ❓ أسئلة مراجعة
1. ليه `GET /getOrders` غلط في REST، مع إنه شغال؟
2. إيه الفرق بين `PUT` و`PATCH`؟ وأنهي واحد هتستخدمه لـ"غيّر اسمي بس"؟
3. "idempotent" يعني إيه؟ وليه مينفعش retry interceptor يعيد `POST /orders` لوحده؟
4. `401` ولا `403`؟ (أ) مفيش token. (ب) عميل عادي بيمسح منتج. (ج) token منتهي.
5. `GET /orders?status=flying` ومفيش أوردرات بالـstatus ده: `404` ولا `200`؟ وليه؟
6. في salla، ليه `merchantCancelOrder` و`userUpdateOrder` مشكلة **أمان** مش بس تسمية؟
7. كود Express 4 فيه `res.send(404)`. إيه اللي هيحصل لو المشروع اترقّى لـExpress 5؟ وFlutter هيشوف إيه؟
8. ضفت field جديد `notes` على الأوردر. محتاج `/api/v2`؟ وشلت field `total`؟

---

## 📚 مصادر
- [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- [MDN — HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [Express — Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html)
- [Microsoft — Web API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
