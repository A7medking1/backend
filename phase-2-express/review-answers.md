# 📝 مراجعة المرحلة 2: الإجابات في مكان واحد

> للمذاكرة: اقرا السؤال، وغطّي الإجابة، وجاوب، وبعدين قارن.

## الدرس 01: أول سيرفر Express

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

## الدرس 02: الـMiddleware

#### 1. الـmiddleware إيه؟ وبيعمل إيه؟
function بتقف بين وصول الـrequest والرد، وبتاخد `(req, res, next)`. بتعمل حاجة من 3:
1. **تعدّل** على `req` أو `res`: `express.json()` بتملا `req.body`.
2. **ترد وتقفل الطلب**: `requireApiKey` بيرد `401`.
3. **تعدّي** للي بعدها بـ`next()`: `logger` و`helmet` و`cors`.

زي الـinterceptors في Dio.

#### 2. مانادتش `next()` ومردتش؟
الطلب بيفضل **معلّق** لحد ما العميل يعمل timeout. مفيش error، ومفيش رد.

#### 3. الـ3 مستويات (من API الأوردرات)
| المستوى | بيتركّب إزاي | مثال |
| --- | --- | --- |
| app | `app.use(...)` على كل request | `morgan`، و`express.json()`، و`helmet`، و`cors` |
| router | `ordersRouter.use(...)` على كل routes الراوتر | لو كل الأوردرات محتاجة مفتاح |
| route | جوه الـroute نفسه | `ordersRouter.post("/", requireApiKey, handler)` |

#### 4. ليه `res.on("finish")` مش بعد `next()`؟
`next()` بترجع على طول، والرد ممكن يتبعت بعدين (handler فيه `await`). لو طبعت بعد `next()` على طول، مش هتعرف الـstatus code ولا الوقت الحقيقي. `finish` بيحصل لما الرد **يتبعت فعلًا**.

#### 5. `req.requestId` من غير ما TypeScript يزعق؟
بـ**declaration merging** في ملف `.d.ts`:
```ts
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
export {};
```

#### 6. `cors` بيأثر على Flutter؟
- **موبايل: لأ.** الـCORS حاجة **المتصفح** هو اللي بيطبّقها، وتطبيق Flutter (بـ`http` أو `dio`) مش متصفح.
- **Flutter Web: آه.** شغّال جوه متصفح، فالسيرفر لازم يسمح بالـorigin بتاعه.

#### 7. `protectRoutes` المتكررة في salla
`router.use(protectRoutes)` **مرة واحدة** في أول الراوتر، فتتطبّق على كل الـroutes اللي تحتها.
