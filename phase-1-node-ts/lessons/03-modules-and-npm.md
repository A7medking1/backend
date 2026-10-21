# الدرس 03 — ES Modules vs CommonJS + npm

> **الهدف:** تعرف تقسّم الكود على ملفات (`import`/`export`)، وتقرا كود الشركة القديم اللي مكتوب بـ`require`، وتفهم `package.json` كويس: الـscripts، الـdependencies، والـversions.
> **الوقت المتوقع:** ساعة ونص.
> **ليه مهم؟** أي مشروع Express حقيقي فيه عشرات الملفات. ولو كود الشركة قديم، هتلاقي `require` و`module.exports` في كل حتة، فلازم تقرا الشكلين.

---

## 1) المشكلة: ملف واحد مش كفاية

في Flutter بتكتب:
```dart
import 'package:http/http.dart' as http;   // package من pub
import '../models/order.dart';            // ملف من مشروعك
```
وكل حاجة public في الملف بتتعمل import تلقائي، إلا لو اسمها بادئ بـ`_`.

في Node **العكس**: كل حاجة في الملف **private** بشكل افتراضي، ولازم تقول صراحةً إيه اللي يطلع بره (`export`).

وفيه **نظامين** للموديولات في Node:

| | CommonJS (CJS) | ES Modules (ESM) |
| --- | --- | --- |
| السنة | 2009 (القديم) | 2015 (الرسمي في JS) |
| الاستيراد | `const x = require("./x")` | `import x from "./x.js"` |
| التصدير | `module.exports = ...` | `export ...` |
| بيتحمّل إمتى | وقت التشغيل، سطر بسطر | قبل التشغيل (static) |
| `await` في أول الملف | ❌ | ✅ (top-level await) |
| `__dirname` | ✅ موجود | ❌ ← استخدم `import.meta.dirname` |
| فين هتشوفه | كود الشركة القديم، Express 4 | المشاريع الجديدة، مشروعنا |

---

## 2) ES Modules — اللي هنكتب بيه

### Named exports (الأكتر استخدامًا)
```ts
// math.ts
export interface Point { x: number; y: number }

export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14;
```
```ts
// main.ts
import { add, PI } from "./math.js";
import type { Point } from "./math.js";   // ← type بس (اشرحها تحت)

console.log(add(1, 2), PI);
```
- الأسامي جوه `{ }` لازم تطابق الأسامي اللي اتعملها export.
- تقدر تغيّر الاسم: `import { add as sum } from "./math.js"` (زي `as` في Dart، بس هنا على اسم واحد مش الملف كله).
- أو تجيب كله: `import * as math from "./math.js"` ← `math.add(...)` (ده أقرب حاجة لـ`import ... as math` في Dart).

### Default export (واحد بس في الملف)
```ts
// greet.ts
export default function greet(name: string): string {
  return `hi ${name}`;
}
```
```ts
import greet from "./greet.js";      // من غير { } — وتسميه أي اسم
import hello from "./greet.js";      // ✅ برضه شغال، نفس الـfunction
```
> 💡 **نصيحة:** استخدم **named exports** في كودك. الـdefault بيخليك تسمي الحاجة أي اسم، فبعد شوية كل ملف بيسميها اسم مختلف والبحث بيبقى صعب. Express نفسه بيستخدم default (`import express from "express"`) وده عادي.

### ⚠️ ليه `"./math.js"` والملف اسمه `math.ts`؟!
دي أكتر حاجة بتلخبط الناس. في الـtsconfig بتاعك `"module": "nodenext"`، وده معناه إن TS بيمشي على قواعد Node بالظبط:
- Node في ESM **لازم** ياخد امتداد الملف.
- والملف اللي Node هيشغّله في الآخر هو `math.js` (بعد الـcompile)، مش `math.ts`.
- فبتكتب **الاسم اللي هيبقى موجود وقت التشغيل**. و`tsx` ذكي وبيلاقي `math.ts` لوحده.

لو نسيت الامتداد:
```
error TS2835: Relative import paths need explicit file extensions in ECMAScript imports
when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './math.js'?
```
> ده **لملفات مشروعك بس** (اللي بتبدأ بـ`./` أو `../`). الـpackages زي `"express"` أو `"node:fs"` من غير امتداد.

### `import type` — ليه عندك `verbatimModuleSyntax`
الـtypes بتختفي بعد الـcompile (مالهاش وجود في JS). الإعداد ده بيجبرك توضّح: **ده type ولا حاجة حقيقية؟**
```ts
import { Point } from "./math.js";
// ❌ error TS1484: 'Point' is a type and must be imported using a type-only import
//    when 'verbatimModuleSyntax' is enabled.

import type { Point } from "./math.js";       // ✅
import { add, type Point } from "./math.js";  // ✅ مخلوطين في سطر واحد
```
الفايدة: أي حد يقرا الكود (أو أي tool) يعرف من غير ما يفكّر إن السطر ده هيتمسح بالكامل بعد الـcompile.

### الـbuilt-in modules: استخدم `node:`
```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
```
الـ`node:` بتوضّح إن دي من Node نفسه، مش package من npm بنفس الاسم. (هندخل في `fs` و`path` في الدرس 06.)

### Top-level await (ESM بس)
```ts
const text = await readFile("./package.json", "utf8"); // ✅ في أول الملف، من غير async function
```
في Dart لازم تكون جوه `main() async`. هنا ESM بيسمح بيها على مستوى الملف.

### `__dirname` مش موجود في ESM
```ts
console.log(import.meta.dirname);   // الفولدر اللي فيه الملف ده (Node 20.11+)
console.log(import.meta.filename);  // المسار الكامل للملف
```

---

## 3) CommonJS — عشان تقرا كود الشركة

```js
// legacy-math.cjs
function sum(a, b) {
  return a + b;
}
const PI = 3.14;

module.exports = { sum, PI };      // ← بيصدّر object فيه الاتنين
```
```js
// app.cjs
const path = require("node:path");
const { sum, PI } = require("./legacy-math.cjs");   // destructuring عادي (درس 01)

console.log(sum(2, 3), PI);
console.log(__dirname, __filename);   // ✅ موجودين في CJS
```

### الترجمة بين الشكلين (احفظ الجدول ده)
| CommonJS | ES Modules |
| --- | --- |
| `const express = require("express")` | `import express from "express"` |
| `const { Router } = require("express")` | `import { Router } from "express"` |
| `module.exports = app` | `export default app` |
| `module.exports = { a, b }` | `export { a, b }` |
| `exports.a = a` | `export const a = ...` |
| `module.exports.a = a` | `export const a = ...` |

### شكل Express 4 القديم اللي ممكن تلاقيه في الشركة
```js
// routes/users.js  (Express 4 + CommonJS)
const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
  res.json([]);
});

module.exports = router;
```
```js
// app.js
const express = require("express");
const usersRouter = require("./routes/users");   // ← لاحظ: من غير .js — CJS بيسمح
const app = express();
app.use("/users", usersRouter);
app.listen(3000);
```
نفس الكود ده بـESM هنكتبه في المرحلة 2. **المنطق واحد، الـsyntax بس اللي بيتغير.**

### الـtrap: `exports = ...` لوحده
```js
exports.a = 1;            // ✅ بيضيف a على الـobject اللي هيطلع
module.exports = { a: 1 }; // ✅ بيستبدل الـobject كله
exports = { a: 1 };        // ❌ مابيعملش حاجة! غيّرت المتغير المحلي بس
```
`exports` هو مجرد اختصار (reference) لـ`module.exports`. لو عملته assign لحاجة جديدة، قطعت الربط. (فاكر الـreference من درس 01؟ نفس فكرة `const` والـobjects.)

### Node بيعرف الملف ESM ولا CJS إزاي؟
1. الامتداد: `.mjs` / `.mts` ← ESM دايمًا. `.cjs` / `.cts` ← CJS دايمًا.
2. لو `.js` / `.ts`: بيبص على `"type"` في أقرب `package.json`:
   - `"type": "module"` ← ESM (**ده اللي عندك**)
   - مش موجود أو `"commonjs"` ← CJS

### ينفع أخلطهم؟
- **ESM يستورد CJS:** ✅ `import pkg from "./legacy.cjs"` (بيرجعلك `module.exports` كـdefault). وده اللي بيخليك تستخدم packages قديمة كتير عادي.
- **CJS يستورد ESM:** في Node 22+ (وعندك 24) ✅ `require("./x.mjs")` بقت شغالة، طول ما الملف مافيهوش top-level await. في الإصدارات القديمة كانت error، فلو شفت `await import(...)` جوه كود CJS قديم، ده كان الحل وقتها.

---

## 4) npm و `package.json`

`package.json` = `pubspec.yaml` بتاع Node.

| Flutter | Node |
| --- | --- |
| `pubspec.yaml` | `package.json` |
| `pubspec.lock` | `package-lock.json` |
| `flutter pub get` | `npm install` |
| `flutter pub add http` | `npm install express` |
| `flutter pub add --dev lints` | `npm install -D typescript` |
| `.dart_tool/` + pub cache | `node_modules/` (جوه المشروع نفسه) |
| `dart run build_runner build` | `npm run <script>` |

### `dependencies` vs `devDependencies`
> (الكومنتات هنا للشرح بس. `package.json` الحقيقي **مابيقبلش كومنتات**.)
```jsonc
"dependencies": {
  "express": "^5.1.0"          // الأبلكيشن محتاجها وهو شغال على السيرفر
},
"devDependencies": {
  "typescript": "^5.9.0",      // محتاجها وأنا بكتب/ببني بس
  "tsx": "^4.20.0",
  "@types/node": "^24.0.0"
}
```
**السؤال اللي تسأله:** "لو السيرفر شغال في الـproduction من الـbuild، هيحتاج الـpackage دي؟"
- `express`، `mongoose`، `zod` ← أيوه ← `dependencies`
- `typescript`، `tsx`، `eslint`، `@types/*`، أدوات التست ← لأ ← `devDependencies`

في الـproduction بيعملوا `npm ci --omit=dev` فالـdevDependencies مابتتنزلش خالص، والـimage بتبقى أصغر.

### الـversions (semver)
`MAJOR.MINOR.PATCH` ← `5.1.3`
- **PATCH** (`.3`): bug fix، مفيش تغيير في الاستخدام.
- **MINOR** (`.1`): features جديدة، والقديم شغال زي ما هو.
- **MAJOR** (`5`): ممكن يكسر الكود بتاعك (زي Express 4 → 5).

| تكتب | يعني بيقبل | مثال |
| --- | --- | --- |
| `^5.1.3` | أي `5.x.x` ≥ 5.1.3 | 5.2.0 ✅ · 6.0.0 ❌ |
| `~5.1.3` | أي `5.1.x` ≥ 5.1.3 | 5.1.9 ✅ · 5.2.0 ❌ |
| `5.1.3` | دي بالظبط | |

(نفس الـ`^` في pubspec بالظبط.)

### `@types/node` لازم يطابق Node بتاعك
`@types/*` دي ملفات **types بس** لمكتبات مكتوبة بـJS. `@types/node` بيوصف الـAPIs بتاعة Node.
- أنت شغال **Node 24**، فالمفروض `@types/node@24`.
- لو نزّلت types لإصدار أحدث (زي 26)، TS هيسيبك تستخدم functions **مش موجودة** في Node 24، والكود هيضرب وقت التشغيل. (فاكر مشكلة `any`؟ نفس الفكرة: الـcompiler مطمّنك على الفاضي.)

### `package-lock.json`
- بيسجّل الـversion **بالظبط** اللي اتنزلت من كل package (وكل الـpackages اللي جواها).
- **بيتعمله commit دايمًا.** ده اللي بيضمن إن جهازك وجهاز زميلك والسيرفر يبقى عندهم نفس الكود.
- `node_modules/` **مابيتعملهوش commit أبدًا** (موجود في `.gitignore` عندك).
- `npm install` ← ممكن يحدّث الـlock. `npm ci` ← بينزّل اللي في الـlock بالظبط أو يفشل (ده اللي بيتستخدم في CI والسيرفر).

### الـscripts
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "test": "vitest"
}
```
- `npm run dev` ← بيشغّل الأمر. وجوه الـscripts تقدر تستخدم أي حاجة في `node_modules/.bin` (زي `tsx` و`tsc`) من غير `npx`.
- `start` و`test` بس ليهم اختصار: `npm start`، `npm test` (من غير `run`).
- **تبعت arguments للـscript** بـ`--`:
  ```bash
  npm run dev -- exercises/02-types.ts
  # ← بيشغّل: tsx watch exercises/02-types.ts
  ```
- `pre` و `post`: لو عندك `prebuild`، هيشتغل تلقائي قبل `build`.

### `npx`
بيشغّل أمر من `node_modules/.bin` بتاع المشروع. ولو الـpackage مش متنزلة، بينزّلها مؤقتًا ويشغّلها.
```bash
npx tsc --version      # الـtsc بتاع المشروع، مش واحدة global
```
> 💡 فضّل دايمًا الأدوات اللي متنزلة **في المشروع** عن الـglobal، عشان كل اللي شغالين على المشروع يبقى عندهم نفس الـversion.

### أوامر هتستخدمها كتير
```bash
npm install                 # نزّل كل اللي في package.json
npm install zod             # ضيف dependency
npm install -D vitest       # ضيف devDependency
npm uninstall zod           # شيلها
npm install -D @types/node@24   # نسخة major معينة
npm outdated                # مين عنده إصدار أحدث
npm ls express              # مين جايب express ونسختها إيه
```

---

## ✍️ التمرين (بإيدك — من غير AI)

### الجزء أ: صلّح المشروع (المعلّقات من الدرس 01)
1. شغّل `npm run dev` واقرا الـerror. السبب إن `tsx watch` محتاج اسم ملف.
   - اختار حل من الاتنين: تحط الملف في الـscript، **أو** تسيبه زي ما هو وتشغّله بـ`npm run dev -- <file>`. جرّب الاتنين واختار واحد.
2. `@types/node` عندك `^26`، ولازم تبقى `24` عشان تطابق Node. صلّحها بأمر npm (مش بإنك تعدّل `package.json` بإيدك)، وبعدين اتأكد إن `npm run typecheck` لسه بيعدّي.
3. بص في `package.json`: هل `typescript` و `tsx` و `@types/node` في المكان الصح (`dependencies` ولا `devDependencies`)؟

### الجزء ب: قسّم تمرين 02 على ملفات (ESM)
اعمل فولدر `exercises/03-modules/` وفيه:
1. `types.ts`: فيه `OrderStatus`، `OrderItem`، `Order`، `ApiResponse<T>`، `UpdateOrder` (كلهم named exports).
2. `orders.ts`: فيه `orderTotal`، `canMoveTo`، `parseStatus`. بيستورد الـtypes من `types.ts`.
3. `response.ts`: فيه `ok` كـ**default export**.
4. `main.ts`: بيستورد من التلاتة ويطبع نفس النتايج بتاعة تمرين 02.

القواعد:
- كل type يتعمله import بـ`import type` أو `type` جوه الـ`{ }`.
- الـimports بتاعة ملفاتك بامتداد `.js`.
- `transitions` (الـRecord) **مايتعملهاش export**. تفضل private جوه `orders.ts`.
- ضيف script اسمه `ex03` يشغّل `main.ts`.

بعد ما يشتغل، **اكسره عن قصد** واقرا كل error:
- شيل `.js` من import واحد.
- شيل `type` من import واحد.
- حاول تعمل import لـ`transitions` في `main.ts`.

### الجزء ج: اقرا CommonJS
اعمل فولدر `exercises/03-legacy/` وفيه:
1. `prices.cjs`: فيه function `withTax(price)` بترجع السعر + 14%، و`const TAX_RATE = 0.14`، والاتنين يتعملهم export بـ`module.exports`.
2. `app.cjs`: بيعمل `require` لـ`prices.cjs` ويطبع `withTax(100)`، و`__dirname`.
3. شغّله بـ`node exercises/03-legacy/app.cjs`. (لاحظ: من غير `tsx`. ده JS عادي.)
4. جرّب الـtrap: غيّر `module.exports = {...}` لـ`exports = {...}` وشوف إيه اللي بيحصل. ارجّعها تاني.

### الجزء د (بونص): اعمل `main.ts` في 03-modules يقرا `package.json` بتاع المشروع بـtop-level await ويطبع الـ`name` والـ`version`.
(💡 `readFile` من `node:fs/promises` + `JSON.parse` + `import.meta.dirname`. وخلي بالك إن `JSON.parse` بترجع `any`.)

شغّل في الآخر:
```bash
npm run ex03
node exercises/03-legacy/app.cjs
npm run typecheck
```
ولما تخلّص قول **"راجع تمرين 03"**.

---

## ❓ أسئلة مراجعة
1. ليه في ESM بتكتب `"./math.js"` رغم إن الملف `math.ts`؟
2. حوّل الكود ده لـESM:
   ```js
   const express = require("express");
   const { z } = require("zod");
   const router = express.Router();
   module.exports = router;
   ```
3. إيه الفرق بين `exports.a = 1` و `exports = { a: 1 }`؟ وليه التاني مابيشتغلش؟
4. `zod` و `vitest` و `mongoose` و `@types/express`: كل واحدة فيهم تروح فين (`dependencies` ولا `devDependencies`)؟ وليه؟
5. `"express": "^5.1.0"`: هل `npm install` ممكن ينزّل `5.3.0`؟ وهل ممكن ينزّل `6.0.0`؟
6. ليه `package-lock.json` بيتعمله commit و `node_modules` لأ؟ وإمتى تستخدم `npm ci` بدل `npm install`؟

---

## ✅ إجابات أسئلة المراجعة
> الـAgent جاوبهم بطلبي (2026-10-21). ارجعلهم وحاول تقولهم بكلامك.

**1.** لأن `"module": "nodenext"` بيمشي على قواعد Node، وNode في ESM لازم ياخد الامتداد. والملف اللي هيبقى موجود وقت التشغيل هو `orders.js` (بعد الـcompile)، فبتكتب اسمه هو. و`tsx` بيلاقي `orders.ts` لوحده.

**2.**
```js
import express from "express";
import { z } from "zod";
const router = express.Router();
export default router;
```
- `require("express")` كان بيرجع الـobject كله ← **default import**.
- `{ z }` كانت destructuring ← **named import**.
- `module.exports = router` (حاجة واحدة) ← **`export default`**.

**3.**
- `exports.a = 1` ← بتضيف `a` على نفس الـobject اللي `module.exports` بيشاور عليه ✅.
- `exports = { a: 1 }` ← بتخلّي المتغير المحلي `exports` يشاور على object **جديد**. أما `module.exports` فبيفضل على القديم الفاضي، والملف بيصدّر `{}` ❌. (جرّبناها: بترجع `{}` فعلًا.)

**4.** السؤال: "السيرفر محتاجها وهو شغال في الـproduction؟"
| Package | مكانها | ليه |
| --- | --- | --- |
| `zod` | `dependencies` | بيعمل validation للـrequests وقت التشغيل |
| `mongoose` | `dependencies` | بيكلّم الداتابيز وقت التشغيل |
| `vitest` | `devDependencies` | للتستات بس |
| `@types/express` | `devDependencies` | types بس، بتتمسح بعد الـcompile |

**5.**
- `5.3.0` ✅ أيوه، لأن `^` بتقبل أي minor أو patch أعلى طول ما الـmajor هو `5`.
- `6.0.0` ❌ لأ، لأن الـmajor اتغيّر، وده معناه إن فيه تغييرات ممكن تكسر الكود.

**6.**
- `package-lock.json` بيسجّل النسخ **بالظبط** لكل package (حتى اللي جوه الـpackages). لما يتعمله commit، جهازك وجهاز زميلك والسيرفر بيبقى عندهم نفس الكود بالظبط.
- `node_modules` كبير جدًا، وبيتعمل من جديد من الـlock في أي وقت (`npm ci`). وكمان فيه ملفات native بتتبني مخصوص لكل نظام تشغيل، فاللي على Windows ماينفعش على Linux.

---

## 📚 مصادر
- [Node.js — Modules: ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js — Modules: CommonJS](https://nodejs.org/api/modules.html)
- [Node.js — Determining module system](https://nodejs.org/api/packages.html#determining-module-system)
- [TypeScript — Modules reference (nodenext)](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [npm — package.json](https://docs.npmjs.com/cli/configuring-npm/package-json)
- [npm — semver calculator](https://semver.npmjs.com/)
