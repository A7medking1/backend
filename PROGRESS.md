# 📍 PROGRESS — متابعة التقدم

> الملف ده هو "نقطة الحفظ". أي Agent أو أي جهاز: ابدأ من هنا.

## أنا واقف فين دلوقتي
- **المرحلة:** 2 — Express Fundamentals
- **الدرس الحالي:** المرحلة 2 — [03 REST](phase-2-express/lessons/03-rest.md) (اقراه من `phase-2-express/lessons/03-rest.html`)
- **الخطوة الجاية:** تمرين Express 03، **الخطوة ب) `PATCH /:id` للـstatus** (400/404/422/409/200). خلص: 0) ترتيب `app.ts` (`helmet → cors → morgan → express.json()`)، وأ) `Location` وفصل 400/422. فاضل بعد ب: ج) `DELETE /:id` بـ204، د) pagination بـ`meta`، هـ) تصميم 6 endpoints من salla على الورق. اختياري: الـ`import { logger }` اللي مش مستخدم في `app.ts`، و`(err)` في callback الـ`app.listen`. الـRequest ID لسه مؤجل. لسه معلّق من قبل: رسالة commit `فف`، وملفين `package.json`/`package-lock.json` في الـroot اتعملوا بالغلط (مش في Git).
- **تاريخ البداية:** 2026-10-19

---

## المراحل
| # | المرحلة | المدة | الحالة |
| --- | --- | --- | --- |
| 1 | Node.js + TypeScript | 1.5 أسبوع | ✅ خلصت |
| 2 | Express Fundamentals | 1.5 أسبوع | 🟡 شغّال |
| 3 | MongoDB + Mongoose (مع Express) | 1.5 أسبوع | ⬜ لسه |
| 4 | Professional Express Architecture | 2 أسبوع | ⬜ لسه |
| 5 | Auth & Security (Express) | 1.5 أسبوع | ⬜ لسه |
| 6 | Testing + Docs | 1 أسبوع | ⬜ لسه |
| 7 | Production & DevOps | 1.5 أسبوع | ⬜ لسه |
| ★ | Capstone — salla_user backend بـ Express | 2 أسبوع | ⬜ لسه |
| 🎁 | Bonus: NestJS (اختياري، بعد ما أبقى محترف Express) | 2.5 أسبوع | ⬜ لسه |

> **قرار 2026-10-19:** الشركة شغالة Express، فـ Express بقى المسار الأساسي، وNestJS اتنقل لآخر الخطة كـ bonus. التفاصيل في [docs/PLAN.md](docs/PLAN.md).

---

## المرحلة 1: Node.js + TypeScript — التفاصيل

### الدروس
- [x] 01 — تجهيز المشروع + `let/const`، arrow functions، destructuring، spread، optional chaining، `==` vs `===`، `null` vs `undefined`
- [x] 02 — TypeScript: types، interfaces، generics، union types، enums
- [x] 03 — ES Modules vs CommonJS + npm (`package.json`، scripts، dependencies vs devDependencies)
- [x] 04 — **Event Loop** و single-threaded (أهم درس في الخطة)
- [x] 05 — Callbacks → Promises → `async/await` + `Promise.all`
- [x] 06 — Built-in modules: `fs`، `path`، `http`، `events`
- [x] 07 — `process.env` و `dotenv` + ESLint + Prettier

### التمارين
- [x] تمرين 1: CLI script يقرا JSON ويطبع إحصائيات
- [x] تمرين 2: HTTP server بـ `http` بس، فيه 3 routes
- [x] تمرين 3: loop تقيلة جوه request handler وأشوف السيرفر بيقف إزاي

### Checkpoint
- [x] أقدر أشرح ليه `await` جوه `for` loop ممكن يكون بطيء، وإمتى أستخدم `Promise.all` بداله.

---

## المرحلة 2: Express Fundamentals — التفاصيل

### الدروس
- [x] 01 — أول سيرفر Express: routes وparams وquery وbody و`Router`، وExpress 5 vs 4
- [x] 02 — الـMiddleware: الترتيب و`next()` (زي interceptors في Dio)، و`morgan` و`cors` و`helmet`
- [ ] 03 — REST: تسمية الـroutes، والـstatus codes، و`/api/v1`
- [ ] 04 — الـErrors: الـerror middleware، و`AppError`، والـasync في Express 5 vs wrappers في Express 4
- [ ] 05 — الـValidation بـZod: `validate(schema)` middleware
- [ ] 06 — التقسيم: routes ← controllers ← services

### المشروع الصغير
- [ ] Todo API في الـmemory: CRUD + Zod + error handler مركزي + logging middleware + 404

### Checkpoint
- [ ] أقدر أرسم رحلة الـrequest في Express من أول ما يوصل لحد الرد (ومعاها: إيه اللي بيحصل لو middleware رمى error)، وأعرف الـstatus code الصح لكل حالة (200، 201، 204، 400، 401، 403، 404، 409، 422، 500).

---

## نقاط محتاجة مراجعة
_(أي حاجة مش واضحة تتكتب هنا لحد ما تتفهم)_
- [x] **Type coercion في `==`**: `==` مابيعملش assign، بيحوّل النوعين لنوع واحد الأول (`""` بتبقى `0`) وبعدين يقارن.
- [x] **Spread بيعمل shallow copy**: الـobjects اللي جوه (nested) بتفضل مشتركة بين النسخة والأصل.
- [ ] **`const` في JS**: المرجع ثابت، بس المحتوى ممكن يتغير (`list.push` شغالة).
- [ ] `@ts-expect-error` و `noUncheckedIndexedAccess` والـ`!`: اتشرحوا، محتاج أعيد شرحهم بكلامي.
- [ ] **`any` vs `unknown`**: `any` نفسها مابتضربش. هي بتقفل الـtype checking، فالغلط بيعدّي من الـcompile ويضرب وقت التشغيل. `unknown` بتجبرني أتأكد من النوع الأول.
- [ ] **ESM imports بتتنفّذ قبل كود الملف** (depth-first بالترتيب): `dotenv.config()` بعد الـimports بتشتغل متأخر. مثال حقيقي: salla شغال بالصدفة. الحل `import "dotenv/config"` أول سطر أو `node --env-file=.env`.
- [ ] **CommonJS عملي**: تمرين 03 الجزء ج اتأجّل. محتاج أكتب `module.exports`/`require` بإيدي مرة قبل المرحلة 4 (قراية كود Express 4 القديم).
- [ ] **الدرس 04 كله الـAgent حلّه** (التمرين + الأسئلة). محتاج أشرح بكلامي: ليه `/fast` استنى، و`hashSync` vs `hash`، و`for+await` vs `Promise.all` (✅ الجزء ده جاوبته بنفسي في الـCheckpoint).
- [ ] **الدرس 05 كله الـAgent حلّه**. أهم حاجة أفهمها بكلامي: الـ3 bugs (`forEach(async)`، و`return` من غير `await`، ونسيان `await`)، والفرق بين `Promise.all` و`Future.wait`.
- [ ] **الدرس 06 كله الـAgent حلّه**. أهم حاجة: المسار النسبي بيتحسب من فين، وإن `emit` sync، والـrace condition في `POST /orders`.
- [ ] **قرار:** `typescript-eslint` مش شغال مع TypeScript 7 (بيطلب أقل من 6.1)، فالمشروع هيرجع لـ`typescript@~6.0.3` في تمرين 07.
- [ ] **ESLint:** متركّب وشغال (`npx eslint exercises`)، بس فيه 10 حاجات اتأجلت: 5 مقصودة محتاجة `eslint-disable` بسبب، و5 حقيقية (`no-misused-promises` في السيرفرات، و`no-floating-promises`، و`require-await`).
- [ ] أسئلة مراجعة الدرس 03 الـAgent جاوبها (الإجابات في آخر ملف الدرس). محتاج أقولها بكلامي.
- [ ] أسئلة 3، 4، 5 بتوع الدرس 02 (literal union، `Partial` vs `Omit`، `?` vs `| undefined`) الـAgent هو اللي جاوبهم. محتاج أشرحهم بكلامي.
- [ ] **أسئلة درس Express 02 (Middleware) الـ7 الـAgent جاوبها بطلبي** (في `phase-2-express/review-answers.md`). أهم حاجة أقولها بكلامي: ليه `res.on("finish")` مش بعد `next()`، والفرق بين الـ3 مستويات، وليه CORS مابيأثرش على Flutter موبايل.

---

## Session Log
| التاريخ | اللي اتعمل |
| --- | --- |
| 2026-10-19 | تجهيز فولدر `backend`، ملف `CLAUDE.md`، ملف المتابعة ده، ونسخ الخطة. كتابة الدرس 01. |
| 2026-10-19 | أول commit على Git. تعديل الخطة: Express هو المسار الأساسي (مراحل 2 و4 اتوسعوا)، وNestJS بقى bonus في الآخر. |
| 2026-10-19 | جهّزت مشروع المرحلة 1 بإيدي (npm init، typescript، tsx، tsconfig) وشغّلت `hello.ts`. ضفت scripts `dev` و `typecheck`. رفعت الـrepo على GitHub (`A7medking1/backend`). |
| 2026-10-20 | حليت `exercises/01-basics.ts` — كل النتايج صح والـtypecheck عدّى. جرّبت `||` vs `??` في `hello.ts`. فاضل: أسئلة المراجعة + 3 تظبيطات من امبارح. |
| 2026-10-20 | جاوبت على أسئلة المراجعة: 3، 4، 5 صح. 1 ناقصة حتة، و2 تفسيرها غلط (اتصححت). 6 و7 ماعرفتهمش واتشرحوا. فاضل سؤالين متابعة قبل الدرس 02. |
| 2026-10-20 | جاوبت سؤالين المتابعة (coercion ✅، spread nested ✅ مع غلطة syntax `=` بدل `:`). **الدرس 01 خلص.** اتكتب الدرس 02. |
| 2026-10-21 | بدأت `exercises/02-types.ts` (خطوة 2 صح، وخطوة 1 اتكتبت object بدل union type). طلبت الحل فاتشرح سطر سطر في الشات، وبعدين أصرّيت إن الـAgent يكتبه في الملف (استثناء من القاعدة). tsx + typecheck عدّوا. فاضل: أسئلة المراجعة الـ5 + أجرّب أكسر الكود عن قصد. |
| 2026-10-21 | جاوبت سؤالين مراجعة الدرس 02: 1 الفكرة صح بس محتاجة دقة، و2 صح من غير مثال. الـAgent جاوب 3 و4 و5. **الدرس 02 خلص.** |
| 2026-10-21 | اتكتب الدرس 03 (ESM vs CJS، `import type`، امتداد `.js`، npm/semver/lock/scripts). تمرين الجزء أ بيقفل المعلّقات بتاعة `dev` و`@types/node`. |
| 2026-10-21 | تمرين 03: الجزء أ خلص (`npm run dev -- <file>`، و`@types/node@24`). الجزء ب (تقسيم 02 على 4 ملفات ESM + script `ex03`) كتبه الـAgent بطلبي. الـrun والـtypecheck عدّوا. فاضل ج و د. |
| 2026-10-21 | أسئلة الدرس 03 اتحلت (الـAgent، بطلبي) واتضافت في آخر ملف الدرس. **الدرس 03 خلص** (الجزء ج اتأجّل). اتكتب الدرس 04 (Event Loop) بأمثلة متجرّبة: لغز الترتيب ESM vs CJS، سيرفر بيقف 2.9s، الحل بـworker_threads، و`bcrypt.hashSync` في salla. |
| 2026-10-21 | الدرس 04: الـAgent حل التمرين كله بطلبي (`exercises/04-event-loop/`، 8 ملفات) وجاوب الأسئلة الـ6 في آخر الدرس. النتايج: `/fast` استنى 4921ms ← 7ms بالـworker، و`for+await` 1015ms vs `Promise.all` 200ms. **الدرس 04 خلص** + تمرين المرحلة 3. |
| 2026-10-21 | اتكتب الدرس 05 (callbacks، promisify، `withResolvers`، all/allSettled/race/any، 4 أخطاء production، و`catchAsyncError` في salla vs Express 5). كل الأمثلة متجرّبة على Node 24. |
| 2026-10-21 | الدرس 05: الـAgent حل التمرين كله بطلبي (`exercises/05-async/`، 5 ملفات) وجاوب الأسئلة الـ7 في آخر الدرس. الـdashboard خلص في 326ms، والـ3 bugs اتصلّحوا. **الدرس 05 خلص.** |
| 2026-10-21 | مشكلة القراية: العربي والإنجليزي بيتلخبطوا. الحل: صفحات HTML من اليمين للشمال وغامقة (`python docs/make-readable.py`)، وCSS للـpreview بتاع VS Code، وملف `review-answers` فيه كل إجابات الدروس 02–05. |
| 2026-10-22 | اتكتب الدرس 06 (`fs` و`path` و`argv` و`http` و`events`). كل الأمثلة متجرّبة، ومعاها أمر `curl.exe` في PowerShell. فيه تمرين 1 و2 بتوع المرحلة. |
| 2026-10-22 | الدرس 06: الـAgent حل التمرين كله بطلبي (`exercises/06-builtins/`: `stats.ts` و`server.ts` و`client.ts` و`order.ts`) وجاوب الأسئلة الـ6. كل الحالات اتجربت. **الدرس 06 خلص، وتمرين 1 و2 بتوع المرحلة كمان.** |
| 2026-10-22 | اتكتب الدرس 07 (`process.env`، `--env-file`، `config.ts` بيقف لو فيه إعداد ناقص، Prettier، ESLint). اكتشفنا إن ESLint مش شغال مع TS 7، فالحل TS 6. وESLint مسك bugs الدرس 05 و10 حاجات في التمارين القديمة. |
| 2026-10-22 | **✅ عدّيت الـCheckpoint بتاع المرحلة 1** بإجابتي: sequential vs parallel، والوقت مجموع vs أطول واحد، و5 حالات ماينفعش فيها `Promise.all` (منهم الـCPU-bound و`allSettled` و batches). فاضل تمرين 07. |
| 2026-10-22 | تمرين 07 الجزء أ: نزّلت TS 6 وESLint وPrettier بإيدي، وعملت `eslint.config.js`، وESLint لقى 10 حاجات (اتأجلوا). |
| 2026-10-22 | تمرين 07 الجزء ب: شفت بإيدي إن `.env` مابيتقراش لوحده، وإن `Boolean("false")` بتبقى `true`. الـAgent كتب `config.ts` بطلبي، واتجرّب: ملف ناقص، و`PORT=abc`، والقيم الافتراضية. اتأجل: سيرفر بـconfig، ومراجعة salla. **الدرس 07 خلص، والمرحلة 1 خلصت.** |
| 2026-10-22 | **بدأت المرحلة 2.** اتكتب درس Express 01 (اتجرّب على Express 5.3.0): routes، والـ3 أماكن بتاعة الداتا، و`Router`، والـ404، وفروق Express 4/5. منهم إن `app.all("/*")` بتاعة salla بتوقّع السيرفر على Express 5. |
| 2026-10-22 | **كتبت بإيدي** أول Orders API بـExpress خطوة بخطوة: جهّزت `phase-2-express`، و`orders.router.ts` (كل الأوردرات + فلترة `?status`، وأوردر بالـid بـ400/404، و`POST` بـvalidation و201)، والـ404 في `app.ts`. اتعلمت من أخطائي: default vs named import، ومسار الـrouter `"/"`، والـ404 لازم في الآخر. |
| 2026-10-22 | قريت `order.router.js` في salla (الـmiddlewares المتكررة، والـvalidation للـparams، و`/updateAll` من غير حماية). الـAgent جاوب أسئلة الدرس 01 بطلبي (في `phase-2-express/review-answers`). **الدرس 01 خلص.** اتكتب الدرس 02 (Middleware)، واتجرّب على Express 5. |
| 2026-10-22 | تمرين Express 02: **كتبت الـlogger بإيدي** (`res.on("finish")`)، وجربت نقله تحت الـrouter وشفت إن الطلبات اللي الـrouter رد عليها ماوصلتلوش. الـRequest ID اتأجل. وقفت عند الخطوة 3 (API key). |
| 2026-10-23 | **الخطوة 3 (حماية الـ`POST` بـAPI key) خلصت.** عملت `.env`/`.env.example` بإيدي، وظبطت `--env-file=.env` **قبل** الملف في script `dev` (اتعلمت: الفلاج قبل الملف = لـNode، بعده = `argv`). كتبت `require-api-key.ts` بإيدي (`x-api-key` lowercase، فصل missing/invalid، `return` بعد كل `res`، كله 401)، وركّبته على الـ`POST` بس بـnamed import. نزّلت `node_modules` (كانت ناقصة ← `tsc not found`). اتجرّب بـ4 حالات curl وكله صح. |
| 2026-10-23 | الخطوة 4: ركّبت `helmet` و`cors()` و`morgan("dev")` بإيدي في `app.ts` (الـAgent نزّل المكتبات)، وشفت headers الأمان و`Access-Control-Allow-Origin: *` بـcurl. الـ`logger` بتاعي فضل import من غير استخدام (قرار معلّق). الـAgent جاوب أسئلة الدرس 02 بطلبي في `review-answers.md`. **الدرس 02 خلص.** |
| 2026-10-23 | اتكتب الدرس 03 (REST): methods وidempotency، والتسمية، والـ10 status codes، و`/api/v1`، وشكل الرد. فيه تحليل لـendpoints salla الحقيقية من `api_constant.dart` (الدور في الـURL مشكلة أمان). اتجرّب على Express 5.3.0: `204` بيشيل الـbody، ومفيش `405` لوحده، و`res.send(404)` و`res.json(obj, 400)` بيرجّعوا **200** في Express 5. |
| 2026-10-23 | تمرين Express 03 (بإيدي): الخطوة 0، رتّبت `app.ts` بعد ما شفنا إن `express.json()` لو قبل `morgan`، الـJSON البايظ مابيتسجّلش. الخطوة أ: فصلت `total` لشرطين بـ`Number.isFinite` (أحسن من `typeof`) وضفت `Location`. الـ`422` بس كتبه الـAgent بطلبي. اكتشفنا كمان إن callback الـ`app.listen` في Express 5 بياخد `err`، فلو البورت مشغول بيطبع الـURL برضه. |
