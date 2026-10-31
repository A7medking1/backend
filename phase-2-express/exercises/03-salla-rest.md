# تمرين Express 03 — الخطوة هـ: salla بشكل REST

> **الـAgent كتب الملف ده بطلبك** (استثناء من القاعدة، زي ما حصل قبل كده). الـ6 endpoints اتقروا من `salla_user/lib/src/core/api/api_constant.dart` ومن الـdata sources اللي بتستخدمهم، فـ"اللي salla بتعمله" تحت حقيقي مش تخمين.
>
> **المطلوب منك:** راجع كل واحد، وقول موافق ولا لأ، وبالكلام بتاعك.

## الملاحظة الكبيرة قبل الجدول
salla بتستخدم `PUT` لكل حاجة بتغيّر حالة: تغيير الـpassword، وقراءة الإشعارات، وقبول السعر، وتعديل التقييم. والـ`PUT` في REST معناه **"استبدل الـresource كله"**. يعني هي بتستخدمه بمعنى "نفّذ فعل"، مش بمعنى "استبدل". ده مش غلط بيكسر حاجة، بس الاسم بيكذب. و`PATCH` أدق لما بنغيّر جزء بس.

## الملخص

| # | salla (الحالي) | REST (المقترح) | نجاح |
| --- | --- | --- | --- |
| 1 | `PUT users/changePassword` | `PATCH /api/v1/users/me/password` | `204` |
| 2 | `PUT notificationsToOne/readAll` | `PATCH /api/v1/users/me/notifications` | `204` |
| 3 | `POST drivers/merchantAddDriver` | `POST /api/v1/merchants/me/drivers` | `201` |
| 4 | `PUT orders/userAcceptNewPriceForOrder/:id` | `PATCH /api/v1/orders/:id/price` | `200` |
| 5 | `PUT reviews/updateReviewToDriver` | `PUT /api/v1/orders/:orderId/review` | `200` |
| 6 | `GET merchantRequests/myRequest` | `GET /api/v1/merchant-requests/me` | `200` |

---

## 1) تغيير الـpassword
**`PATCH /api/v1/users/me/password`** ← `204`

- **Body:** `{ "currentPassword": "...", "newPassword": "..." }`
- **ليه `PATCH`:** بنعدّل حاجة موجودة (جزء من الـuser)، مش بنعمل resource جديد.
- **ليه `me`:** المستخدم بيجي من الـtoken. لو الـURL فيه `:id` ممكن حد يجرّب يغيّر password حد تاني (IDOR).
- **ليه `204`:** مفيش حاجة جديدة اتعملت ومفيش حاجة مفيدة أرجّعها. وأكيد مش هرجّع الـpassword.
- **الأخطاء:** `400` الـbody ناقص، `401` مفيش token، `403` الـ`currentPassword` غلط، `422` الـ`newPassword` ضعيف.

## 2) قراءة كل الإشعارات
**`PATCH /api/v1/users/me/notifications`** ← `204`

- **Body:** `{ "read": true }`
- **ليه ده:** الفعل `readAll` بيتحول لـ"عدّل حالة `read` في كل إشعارات المستخدم". بدون `:id` لأنه على المجموعة كلها، ومحدد بالـtoken.
- **idempotent:** لو اتنفذ 10 مرات النتيجة واحدة، وده بيدّي الـretry أمان.
- **ليه `204`:** مفيش حاجة تترجع. الـapp في salla أصلًا بيتجاهل الرد (`Future<void>`).
- **بديل:** `POST /api/v1/users/me/notifications/read-all`. ده مقبول لما الفعل مش بيتحول لتعديل حالة واضح، بس هنا بيتحول، فالأول أنضف.

## 3) التاجر يضيف سواق
**`POST /api/v1/merchants/me/drivers`** ← `201`

- **Body:** بيانات السواق (الاسم والتليفون...)
- **ليه `POST` على المجموعة:** بنعمل resource جديد والسيرفر هو اللي بيحدد الـid.
- **ليه `merchants/me/drivers`:** السواق تابع للتاجر (sub-resource)، والتاجر من الـtoken. فكلمة `merchant` في اسم الـendpoint (`merchantAddDriver`) مكانها الـURL ملهاش لازمة كفعل.
- **ليه `201`** + header `Location: /api/v1/merchants/me/drivers/:id` + السواق الجديد في الـbody.
- **الأخطاء:** `400` بيانات ناقصة، `401` مفيش token، `403` المستخدم مش تاجر، `409` السواق ده مضاف قبل كده (تليفون مكرر)، `422` رقم تليفون شكله غلط.
- **افتراض:** إن ده بيعمل سواق جديد. لو بيربط سواق موجود بالتاجر فهو `PUT .../drivers/:driverId` بـ`204`.

## 4) المستخدم يقبل السعر الجديد للأوردر
**`PATCH /api/v1/orders/:id/price`** ← `200`

- **Body:** `{ "status": "accepted" }`
- **ليه ده:** "قبول السعر" هو تغيير حالة جوه الأوردر. نفس فكرة `PATCH /orders/:id` اللي كتبتها، بس على جزء السعر بقواعده الخاصة. وده بيشيل الفعل `userAccept...` من الـURL.
- **ليه `200` مش `204`:** السعر والأوردر اتغيروا، فالأحسن أرجّع الأوردر بعد التعديل (زي الـ`PATCH` بتاعك).
- **الأخطاء:** `400` الـid مش رقم، `401` مفيش token، `403` الأوردر مش بتاع المستخدم ده، `404` مفيش أوردر، `409` مفيش سعر جديد مستني أو اتقبل قبل كده (نفس قرارك في `409 "Order is already X"`).
- **ملاحظة:** salla بتبعت `PUT` من غير body، يعني الفعل كله في الـURL. هنا الفعل في الـbody (`status`)، فالـURL بيفضل اسم.

## 5) تعديل التقييم للسواق
**`PUT /api/v1/orders/:orderId/review`** ← `200`

- **Body:** `{ "description": "..." }` (الـsalla الحالية بتبعت `{ order, description }`، والـ`order` هنا اتنقل للـURL)
- **ليه التقييم تابع للأوردر:** الـparams بتاعت salla فيها `order` و`description`، يعني التقييم بيتحدد بالأوردر. مفيش تقييم من غير أوردر، فهو sub-resource، وكل أوردر ليه تقييم واحد.
- **ليه `PUT` هنا بالذات:** المستخدم بيبعت التقييم بالكامل واحنا بنستبدله، والـresource واحد وثابت الـURL. فـ`PUT` معناه الحقيقي (idempotent، ولو مفيش تقييم قبل كده ممكن يعمله).
- **ليه `200`:** بنرجّع التقييم بعد التعديل. ولو `PUT` عمله لأول مرة ممكن `201`.
- **الأخطاء:** `400` الـid مش رقم، `401` مفيش token، `403` الأوردر مش بتاع المستخدم، `404` مفيش أوردر، `422` الـ`description` فاضي أو طويل.

## 6) طلب التاجر بتاعي
**`GET /api/v1/merchant-requests/me`** ← `200`

- **ليه `GET`:** قراءة بس، ولازم تكون safe و idempotent. وsalla عاملاه `GET` فعلًا، فالـmethod سليم (زي `POST` في #3). الغلط في الـURL بس.
- **ليه `merchant-requests/me`:** الرد في salla هو **object واحد** (`response.data['result']`)، مش list. يعني طلب واحد لكل مستخدم، وهو طلب إنه يبقى تاجر. فمفيش `:id`، والمستخدم من الـtoken. وكتبتها `merchant-requests` بشرطة لأن الـURL حروف صغيرة.
- **الرد:** `{ "ok": true, "data": { ... } }`
- **الأخطاء:** `401` مفيش token، و`404` لو المستخدم ماقدّمش طلب أصلًا.
- **افتراض:** إن ده طلب تقديم لتاجر. لو كان list لطلبات التاجر فهو `GET /api/v1/merchants/me/requests` مع pagination.

---

## اللي المفروض تقوله بكلامك (للمراجعة)
1. ليه `me` أحسن من `:id` في الـURL لما المستخدم هو نفسه صاحب الـresource؟
2. إمتى `PUT` ينفع (#5) وإمتى `PATCH` أدق (#1 و#2 و#4)؟
3. ليه `204` في #1 و#2 و`200` في #4؟
