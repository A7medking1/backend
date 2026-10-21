# 📍 PROGRESS — متابعة التقدم

> الملف ده هو "نقطة الحفظ". أي Agent أو أي جهاز: ابدأ من هنا.

## أنا واقف فين دلوقتي
- **المرحلة:** 1 — Node.js + TypeScript
- **الدرس الحالي:** 05 — Callbacks → Promises → `async/await` + `Promise.all` (لسه ماتكتبش)
- **الخطوة الجاية:** أذاكر حل وإجابات الدرس 04 (في آخر ملف الدرس)، وبعدين كتابة الدرس 05. لسه معلّق من قبل: رسالة commit `فف`.
- **تاريخ البداية:** 2026-10-19

---

## المراحل
| # | المرحلة | المدة | الحالة |
| --- | --- | --- | --- |
| 1 | Node.js + TypeScript | 1.5 أسبوع | 🟡 شغّال |
| 2 | Express Fundamentals | 1.5 أسبوع | ⬜ لسه |
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
- [ ] 05 — Callbacks → Promises → `async/await` + `Promise.all`
- [ ] 06 — Built-in modules: `fs`، `path`، `http`، `events`
- [ ] 07 — `process.env` و `dotenv` + ESLint + Prettier

### التمارين
- [ ] تمرين 1: CLI script يقرا JSON ويطبع إحصائيات
- [ ] تمرين 2: HTTP server بـ `http` بس، فيه 3 routes
- [x] تمرين 3: loop تقيلة جوه request handler وأشوف السيرفر بيقف إزاي

### Checkpoint
- [ ] أقدر أشرح ليه `await` جوه `for` loop ممكن يكون بطيء، وإمتى أستخدم `Promise.all` بداله.

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
- [ ] **الدرس 04 كله الـAgent حلّه** (التمرين + الأسئلة). محتاج أشرح بكلامي: ليه `/fast` استنى، و`hashSync` vs `hash`، و`for+await` vs `Promise.all` (ده سؤال الـCheckpoint بتاع المرحلة، ولازم أجاوبه بنفسي قبل ما أقفل المرحلة 1).
- [ ] أسئلة مراجعة الدرس 03 الـAgent جاوبها (الإجابات في آخر ملف الدرس). محتاج أقولها بكلامي.
- [ ] أسئلة 3، 4، 5 بتوع الدرس 02 (literal union، `Partial` vs `Omit`، `?` vs `| undefined`) الـAgent هو اللي جاوبهم. محتاج أشرحهم بكلامي.

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
