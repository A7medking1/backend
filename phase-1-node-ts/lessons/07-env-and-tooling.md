# الدرس 07 — `process.env` و ESLint و Prettier (آخر درس في المرحلة 1)

> **الهدف:** تعرف تحط الإعدادات والأسرار بره الكود، وتتأكد منها أول ما السيرفر يقوم، وتخلّي أدوات تمسكلك الأخطاء وتظبط شكل الكود لوحدها.
> **الوقت المتوقع:** ساعة ونص.
> **ليه مهم؟** أول حاجة هتعملها في أي مشروع في الشركة: `npm install`، وبعدين تعمل ملف `.env`، وبعدين `npm run lint`. ولو فهمت الحتة دي غلط، هتسرّب أسرار أو تكسر الـproduction.

> كل حاجة في الدرس **اتجربت فعلًا** على Node v24.14.0 على Windows.

---

## 1) `process.env`: الإعدادات اللي بره الكود

الإعدادات اللي بتتغير من مكان للتاني **ماتتكتبش في الكود**:

| الإعداد | على جهازك | على السيرفر |
| --- | --- | --- |
| `PORT` | `3000` | `8080` |
| `DB_URL` | داتابيز محلية | داتابيز الـproduction |
| `JWT_SECRET` | أي كلام | سر حقيقي **مايتشافش** |

في Flutter أقرب حاجة ليها `--dart-define` أو ملفات الـflavors. هنا اسمها **environment variables**، وبتتقري من `process.env`:
```ts
const port = process.env.PORT;
```

### ⚠️ 3 حاجات لازم تحفظها
**1. كل القيم `string` أو `undefined`، عمرها ما بتبقى رقم أو boolean.**
```ts
// .env فيه: PORT=4000  و  DEBUG=false
process.env.PORT;              // "4000"  ← string مش رقم
Number(process.env.PORT);      // 4000
Number("abc");                 // NaN    ← مابيرميش error!
```

**2. فخ الـ`"false"`:**
```ts
Boolean(process.env.DEBUG);         // true   😱 أي نص مش فاضي يعتبر true
process.env.DEBUG === "true";       // false  ✅ قارن بالنص نفسه
```
> 🔍 في salla: `if (process.env.DEVELOPMENT)`. لو حد كتب `DEVELOPMENT=false` عشان يقفل وضع التطوير، **هيفضل شغال**، وهيرجّع الـstack trace للمستخدمين.

**3. اللي مش موجود بيرجع `undefined` بهدوء، من غير أي error.** يعني السيرفر هيقوم عادي، وهيقع بعدين في نص request. والحل في قسم 3.

---

## 2) ملف `.env`

بدل ما تكتب الإعدادات في الـterminal كل مرة، بتحطها في ملف اسمه `.env` جنب المشروع:
```
PORT=4000
DB_URL=mongodb://localhost:27017/app
DEBUG=false
# دي كومنت
GREETING="hello world"
```

### تحمّله إزاي؟ (3 طرق)
**أ) من Node نفسه، من غير أي package** ✅ الأحسن للمشاريع الجديدة:
```bash
npx tsx --env-file=.env src/index.ts
```
```bash
node --env-file=.env dist/index.js
```
- لو الملف مش موجود: `nope.env: not found`، والبرنامج مابيشتغلش.
- لو عايزه اختياري: `--env-file-if-exists=.env`.

**ب) من جوه الكود:**
```ts
process.loadEnvFile(".env");
```

**ج) بـpackage اسمها `dotenv`** (اللي هتلاقيها في كود الشركة القديم):
```ts
import "dotenv/config";   // ← لازم أول سطر في أول ملف
```
> 🔍 فاكر مشكلة salla في الدرس 03؟ كاتبين `import dotenv from "dotenv"; dotenv.config();` **تحت** الـimports التانية، والـimports بتتنفّذ الأول. والسطر اللي فوق بيحل المشكلة دي، لأنه هو نفسه import.

### مين يكسب لو القيمة موجودة في المكانين؟
القيمة الحقيقية في الـterminal أو على السيرفر **بتكسب** على اللي في `.env`:
```powershell
$env:PORT=5000; npx tsx --env-file=.env env.ts
# PORT: 5000
```
وده الصح، لأن السيرفر بيحط قيمه الحقيقية، و`.env` بيبقى للتطوير بس.

### 🔐 القاعدة الذهبية
| الملف | يترفع على Git؟ | فيه إيه |
| --- | --- | --- |
| `.env` | ❌ **أبدًا** | القيم الحقيقية والأسرار |
| `.env.example` | ✅ | نفس الأسامي، بقيم وهمية أو فاضية |

```
# .env.example
PORT=3000
DB_URL=
JWT_SECRET=
```
أي حد جديد يعمل نسخة من `.env.example` باسم `.env` ويملاها. والـ`.gitignore` بتاعك فيه `.env` من الأول ✅.

> 🔍 في salla: الـ`.gitignore` **مافيهوش `.env`**، ولا ملف مفتاح Firebase. فلو حد عمل `git add .` هيترفعوا.

---

## 3) اتأكد من الإعدادات أول ما السيرفر يقوم (Fail fast)

بدل ما تقرا `process.env` في كل حتة في المشروع، اعمل ملف واحد بيقراهم ويتأكد منهم **مرة واحدة** في الأول:
```ts
// config.ts
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`missing env var: ${name}`);
  }
  return value;
}

function toPort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got "${value}"`);
  }
  return port;
}

export const config = {
  port: toPort(process.env.PORT ?? "3000"),     // اختياري وليه قيمة افتراضية
  dbUrl: required("DB_URL"),                    // إجباري
  debug: process.env.DEBUG === "true",          // boolean صح
};
```
```ts
// server.ts
import { config } from "./config.js";
server.listen(config.port);
```
**ليه؟** لو نسيت `DB_URL`، السيرفر **مش هيقوم أصلًا**، وهيقولك بالظبط إيه الناقص. أحسن بكتير من إنه يقوم ويقع بعد ساعة في نص request لمستخدم.
> في المرحلة 4 هنعمل نفس الحتة دي بـ**Zod** في سطور أقل.

---

## 4) Prettier: شكل الكود

Prettier بيظبط **الشكل بس**: المسافات، والـ`;`، والـquotes، والسطور الطويلة. زي `dart format` بالظبط.
```ts
// قبل
const   x={a:1,b:[1,2,3]}
console.log( x )
```
```ts
// بعد npx prettier --write
const x = { a: 1, b: [1, 2, 3] };
console.log(x);
```
```bash
npx prettier --check .
```
```bash
npx prettier --write .
```
- `--check`: يقولك مين محتاج تظبيط، ومايغيرش حاجة. ودي اللي بتشتغل في الـCI.
- `--write`: يظبّط الملفات فعلًا.

**ليه مهم في فريق؟** محدش هيتخانق على المسافات في الـcode review، والـdiff بيبقى فيه التغيير الحقيقي بس.

---

## 5) ESLint: الأخطاء اللي الـTS مابيمسكهاش

`tsc` بيتأكد من **الأنواع**. أما ESLint فبيدوّر على **أخطاء منطقية وعادات خطر**. زي `dart analyze` مع الـlints.

### جربته على الـbugs بتاعة الدرس 05
فاكر الكود اللي **عدّى الـtypecheck من غير ولا error** ووقع وقت التشغيل؟ ESLint مسكه:
```ts
async function main() {
  save(1);                          // نسيت await
  [1, 2].forEach(async (id) => {    // forEach مع async
    await save(id);
  });
  const data: any = JSON.parse("{}");
  console.log(data.x);
  let unused = 5;
}
main();
```
```
7:3   no-floating-promises       Promises must be awaited ...         ← نسيت await
8:18  no-misused-promises        Promise returned in function argument ← forEach(async)
11:9  no-unsafe-assignment       Unsafe assignment of an `any` value
11:15 no-explicit-any            Unexpected any
12:20 no-unsafe-member-access    Unsafe member access .x on an `any` value
13:7  prefer-const               'unused' is never reassigned. Use 'const'
13:7  no-unused-vars             'unused' is assigned a value but never used
15:1  no-floating-promises       ← main() من غير await
✖ 9 problems
```
**يعني ESLint كان هيوفّر عليك الدرس 05 كله** 😄

### ⚠️ مشكلة حقيقية: ESLint مش شغال مع TypeScript 7
مشروعك فيه `typescript@^7.0.2`، ودي النسخة الجديدة اللي اتكتبت من الأول بلغة Go. ولما جربت أنزّل ESLint:
```
npm error Could not resolve dependency:
npm error peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.72.0
```
`typescript-eslint` بيقول: "أنا شغال مع TypeScript **أقل من 6.1** بس". ودي اسمها **peer dependency**: الـpackage مش بتنزّل TypeScript بنفسها، بس بتشترط إن اللي عندك يكون نسخة معينة.

**الحل:** نرجع لـTypeScript 6. جربته على المشروع كله، والـtypecheck عدّى من غير ولا error. وفي الشغل هتلاقي أغلب المشاريع لسه على TypeScript 5، فده عادي جدًا.
> 💡 **درس مهم:** ماتنزّلش آخر نسخة من كل حاجة وخلاص. الأدوات بتاخد وقت لحد ما تلحق بعض.
> ⚠️ **وماتستخدمش `--force` ولا `--legacy-peer-deps`** عشان تعدّي الـerror ده. هيتنزل، بس هيبوظ بطريقة مش واضحة بعدين.

### الإعداد
```bash
npm install -D typescript@~6.0.3 eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```
- `~6.0.3`: أي `6.0.x` بس (الدرس 03).
- `eslint-config-prettier`: بيقفل قواعد ESLint اللي بتتخانق مع Prettier على الشكل. كده ESLint للأخطاء، وPrettier للشكل.

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default defineConfig(
  { ignores: ["node_modules", "dist", "**/*.cjs"] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,   // ← القواعد اللي بتفهم الأنواع
  {
    languageOptions: {
      parserOptions: {
        projectService: true,                 // ← بيقرا الـtsconfig بتاعك
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettier,                                   // ← لازم آخر واحد
);
```
```json
// .prettierrc.json
{ "printWidth": 100 }
```
```json
// package.json → scripts
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check ."
```
> لو عايز VS Code يصلّح لوحده وأنت بتحفظ: نزّل الـextensions بتوع **ESLint** و**Prettier**.

### لما جربته على تمارينك اللي فاتت
لقى **10 حاجات**، وأغلبها حقيقي:

| الملف | القاعدة | معناها |
| --- | --- | --- |
| `06-builtins/server.ts` | `no-misused-promises` | `http.createServer(async ...)` ← لو الـasync handler رمى error بره الـtry، محدش هيمسكه |
| `06-builtins/server.ts` | `no-misused-promises` | `bus.on("...", async ...)`: نفس فكرة `emit` اللي مابيستناش |
| `04-event-loop/fixed-server.ts` | `no-misused-promises` | نفس مشكلة `createServer(async ...)` |
| `04-event-loop/order.ts` | `no-floating-promises` | `Promise.resolve().then(...)` من غير `await` |
| `05-async/retry.ts` | `require-await` | `async function` مافيهاش ولا `await` |
| `04-event-loop/*` | `no-empty` | الـ`while` الفاضية (دي **مقصودة** للتجربة) |
| `01-basics.ts` | `ban-ts-comment` و`no-constant-binary-expression` | تجارب الدرس 01 (مقصودة) |

**مش كل error لازم يتصلّح.** لو حاجة مقصودة، اكتب جنبها سطر بيقفل القاعدة **ومعاه السبب**:
```ts
// eslint-disable-next-line no-empty -- busy loop on purpose, to block the event loop
while (Date.now() < end) {}
```

---

## ✍️ التمرين (بإيدك — من غير AI)

### أ) الأدوات
1. نزّل الأدوات بالأمر اللي في قسم 5. (`typescript` هتنزل من 7 لـ6.)
2. اعمل `eslint.config.js` و`.prettierrc.json`، وضيف الـscripts التلاتة.
3. اتأكد إن `npm run typecheck` لسه بيعدّي.
4. شغّل `npm run lint`. لكل حاجة طلعت: **صلّحها** لو حقيقية، أو اقفلها بكومنت فيه السبب لو مقصودة.
5. شغّل `npm run format`، وبص على اللي اتغيّر بـ`git diff`.

### ب) الإعدادات (`exercises/07-env/`)
1. اعمل `.env.example` فيه `PORT` و`ORDERS_FILE` و`DEBUG`، و`.env` بقيم حقيقية.
2. اكتب `config.ts` زي قسم 3:
   - `PORT` اختياري، والافتراضي `3000`، ولازم يكون رقم صح.
   - `ORDERS_FILE` إجباري.
   - `DEBUG` يبقى `true` بس لو مكتوب `"true"`.
3. اعمل نسخة من سيرفر الدرس 06 تاخد الـport ومسار الملف من `config`.
4. ضيف script اسمه `ex07` بيشغّله بـ`--env-file=.env`.
5. جرّب تكسره:
   - امسح `ORDERS_FILE` من `.env` ← السيرفر **مايقومش**، ويقولك اسم الناقص.
   - خلي `PORT=abc` ← نفس الكلام.
   - خلي `DEBUG=false` ← اتأكد إنها `false` فعلًا.

### ج) راجع salla (قراية بس، ماتعدلش فيه)
اكتب في ورقة كل حاجة في salla ليها علاقة بالدرس ده، وإزاي كنت هتصلّحها. (فيه 4 على الأقل.)

شغّل في الآخر:
```bash
npm run typecheck
```
```bash
npm run lint
```
```bash
npm run format:check
```
ولما تخلّص قول **"راجع تمرين 07"**.

---

## ❓ أسئلة مراجعة
1. ليه `Boolean(process.env.DEBUG)` غلط؟ واكتب الصح.
2. إيه الفرق بين `.env` و`.env.example`؟ ومين فيهم يترفع على Git؟
3. ليه نتأكد من الإعدادات أول ما السيرفر يقوم، بدل ما نقراها وقت الاستخدام؟
4. لو `PORT` موجود في `.env` وكمان على السيرفر بقيمة تانية، مين يكسب؟ وليه ده صح؟
5. إيه الفرق بين اللي `tsc` بيمسكه واللي ESLint بيمسكه؟ اديني مثال لحاجة ESLint بس اللي يمسكها.
6. يعني إيه peer dependency؟ وليه ماينفعش نحل المشكلة بـ`--force`؟
7. إيه الفرق بين ESLint وPrettier؟ وليه بنحتاج `eslint-config-prettier`؟

---

## ⭐ وبعد الدرس ده: الـCheckpoint
المرحلة 1 مش هتتقفل إلا لما **أنت** تجاوب السؤال ده بكلامك:
> **ليه `await` جوه `for` loop ممكن يكون بطيء؟ وإمتى تستخدم `Promise.all` بداله؟**

---

## 📚 مصادر
- [Node.js — Environment variables (`--env-file`)](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [The Twelve-Factor App — Config](https://12factor.net/config) ← ليه الإعدادات بره الكود
- [typescript-eslint — Getting started](https://typescript-eslint.io/getting-started)
- [typescript-eslint — no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises)
- [Prettier — Install](https://prettier.io/docs/install)
