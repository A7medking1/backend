# الدرس 06 — الـBuilt-in Modules: `fs` و `path` و `http` و `events`

> **الهدف:** تستخدم الأدوات اللي جاية مع Node من غير أي package: تقرا وتكتب ملفات، وتبني مسارات صح، وتعمل سيرفر HTTP بإيدك، وتفهم الـevents.
> **الوقت المتوقع:** ساعتين.
> **ليه مهم؟** Express نفسه مبني فوق `http`. لما تشوف إزاي السيرفر بيشتغل من غير framework، هتفهم Express بيعملك إيه بالظبط في المرحلة 2.
> **في الدرس ده تمرين 1 وتمرين 2 بتوع خطة المرحلة.**

> كل الأمثلة **اتجربت فعلًا** على Node v24.14.0 على Windows.

---

## 1) `node:fs/promises`: الملفات

في Flutter بتستخدم `File` من `dart:io`. هنا نفس الفكرة:

| Dart | Node |
| --- | --- |
| `File(p).readAsString()` | `readFile(p, "utf8")` |
| `File(p).writeAsString(s)` | `writeFile(p, s)` |
| `File(p).writeAsString(s, mode: FileMode.append)` | `appendFile(p, s)` |
| `Directory(p).create(recursive: true)` | `mkdir(p, { recursive: true })` |
| `Directory(p).list()` | `readdir(p)` |
| `File(p).exists()` | مافيش حاجة مباشرة، جرّب تقرا وامسك الـerror |
| `File(p).delete()` | `rm(p)` |

```ts
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";

await mkdir("data", { recursive: true });          // مابيرميش error لو موجود
await writeFile("data/orders.json", JSON.stringify([{ id: 1 }], null, 2));

const text = await readFile("data/orders.json", "utf8");
const orders: unknown = JSON.parse(text);           // ← unknown، فاكر الدرس 02؟
```

### ⚠️ ليه `unknown` مع `JSON.parse`؟
`JSON.parse` بترجع `any`، والملف ممكن يكون فيه أي حاجة. فخليها `unknown` واتأكد من شكلها قبل ما تستخدمها، بالظبط زي `req.body`.

### الـerrors بتاعة الملفات
كل error من `fs` فيه خاصية اسمها `code`:
```ts
try {
  await readFile("nope.json", "utf8");
} catch (err) {
  if (err instanceof Error && "code" in err && err.code === "ENOENT") {
    console.log("الملف مش موجود");
  }
}
// النتيجة: code: ENOENT
```
| الـcode | معناه |
| --- | --- |
| `ENOENT` | الملف أو الفولدر مش موجود |
| `EACCES` | مالكش صلاحية |
| `EEXIST` | موجود قبل كده |
| `EISDIR` | ده فولدر مش ملف |

### ❌ ماتستخدمش `*Sync` جوه السيرفر
`readFileSync` بتوقّف الـevent loop (الدرس 04). مسموح بيها **بس** وقت الـstartup قبل `listen`.
> 🔍 في salla: `fileUpload.js` بيستخدم `fs.existsSync` و`fs.mkdirSync` جوه الـrequest. صغيرين، بس نفس الفكرة.

### الملفات الكبيرة: streams
`readFile` بتحمّل الملف **كله** في الـmemory. لو الملف 2GB هتقع. والحل `createReadStream`، اللي بيقرا حتة حتة. هنستخدمه في رفع الملفات في المرحلة 2.

---

## 2) `node:path`: المسارات

**ماتجمعش المسارات بـ`+` أبدًا.** Windows بيستخدم `\` وLinux بيستخدم `/`، والسيرفر غالبًا Linux.
```ts
import path from "node:path";

const file = path.join(import.meta.dirname, "data", "orders.json");
// على جهازك: D:\backend\...\data\orders.json
// على السيرفر: /app/.../data/orders.json

path.basename(file);            // orders.json
path.extname(file);             // .json
path.basename(file, ".json");   // orders
path.dirname(file);             // الفولدر اللي فيه الملف
path.join("a", "..", "b", "c.txt"); // b\c.txt   ← بيظبط الـ..
path.resolve("x");              // مسار كامل من الفولدر الحالي
```

### ⚠️ `"data/orders.json"` نسبةً لإيه؟
المسار النسبي بيتحسب من **الفولدر اللي شغّلت منه الأمر**، مش من مكان الملف. لو شغّلت من `D:\backend` بدل `phase-1-node-ts`، الملف مش هيتلاقي.
**الحل:** ابدأ دايمًا من `import.meta.dirname` (الدرس 03):
```ts
const DATA = path.join(import.meta.dirname, "data", "orders.json");
```

---

## 3) `process.argv`: الـarguments بتاعة الـCLI
```bash
npx tsx stats.ts orders.json --top
```
```ts
console.log(process.argv);
// [ "مسار node", "مسار stats.ts", "orders.json", "--top" ]

const args = process.argv.slice(2);   // ← اللي كتبته أنت بس
// [ "orders.json", "--top" ]
```
وعشان تنهي البرنامج بفشل:
```ts
console.error("لازم تدّيني اسم ملف");
process.exitCode = 1;   // ← أحسن من process.exit(1)، بيسيب الشغل يخلص الأول
```
> 💡 `exit code` بيقول للـterminal أو للـCI البرنامج نجح ولا لأ: `0` نجح، وأي رقم غيره فشل.

---

## 4) `node:http`: سيرفر من غير Express

```ts
import http from "node:http";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(3000, () => console.log("http://localhost:3000"));
```

### `req` و `res`
| | فيه إيه |
| --- | --- |
| `req.method` | `"GET"` أو `"POST"` أو ... |
| `req.url` | المسار كله مع الـquery: `/orders?status=pending` |
| `req.headers` | الـheaders، وأسماءها كلها small letters |
| `res.writeHead(status, headers)` | الـstatus والـheaders |
| `res.end(body)` | ابعت الرد واقفل. **لازم** تتنادى مرة واحدة في كل request |

### الـquery string
```ts
const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
url.pathname;                    // /orders
url.searchParams.get("status");  // pending  أو  null
```

### قراية الـbody (أصعب حتة)
الـbody **مابيوصلش مرة واحدة**، بيوصل حتت (stream). فلازم تجمّعه:
```ts
async function readBody(req: http.IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}

const data: unknown = JSON.parse(await readBody(req));  // لو JSON بايظ ← بيرمي error
```
النتايج الحقيقية:
```
GET  /health?q=hi        → 200 {"ok":true,"q":"hi"}
POST /echo  {"a":1}      → 201 {"got":{"a":1}}
POST /echo  oops         → 400 {"error":"invalid JSON"}
GET  /x                  → 404
```

### Express بيعملك إيه من ده كله؟
| بإيدك هنا | في Express |
| --- | --- |
| `if (req.method === "GET" && url.pathname === "/health")` | `app.get("/health", ...)` |
| `readBody` + `JSON.parse` + `try/catch` | `app.use(express.json())` |
| `url.searchParams.get("status")` | `req.query.status` |
| `/orders/5` ← تقطّع الـpathname بإيدك | `app.get("/orders/:id")` ← `req.params.id` |
| `res.writeHead(200, {...}); res.end(JSON.stringify(x))` | `res.status(200).json(x)` |
| `if` كبيرة للـ404 في الآخر | middleware للـ404 |

**يعني Express مش سحر.** هو نفس `http.createServer` ومعاه أدوات بتوفّر عليك الكتابة.

---

## 5) `node:events`: الـEventEmitter

نفس فكرة `Stream` و`StreamController` في Dart: حد بيبعت event، وأي حد مشترك بيسمعه.
```ts
import { EventEmitter } from "node:events";

interface Order { id: number; total: number }

// الـgeneric بيحدد اسم كل event ونوع الداتا اللي معاه
const bus = new EventEmitter<{ "order:created": [Order] }>();

bus.on("order:created", (o) => console.log("log:", o.id));          // كل مرة
bus.once("order:created", (o) => console.log("first only:", o.id)); // أول مرة بس

bus.emit("order:created", { id: 1, total: 10 });
bus.emit("order:created", { id: 2, total: 20 });
console.log("after emit");
```
النتيجة:
```
log: 1
first only: 1
log: 2
after emit      ← ⚠️ لاحظ: اتطبعت في الآخر
```

### ⚠️ حاجتين مهمين
1. **`emit` بتشتغل sync**، مش async زي `Stream` في Dart. كل الـlisteners بتتنفّذ **قبل** السطر اللي بعد `emit`. فلو listener فيه شغل تقيل، هيوقّف الـevent loop.
2. **الـevent اللي اسمه `"error"` خاص:** لو عملت `emit("error", ...)` ومافيش حد سامعه، **بيرمي الـerror** وممكن يوقّع السيرفر.

### فين هتشوف EventEmitter؟
حاجات كتير في Node هي EventEmitter أصلًا: `server.on("listening")`، و`req.on("data")`، و`process.on("unhandledRejection")` (اللي شفناه في salla)، و`mongoose.connection.on("error")`.

---

## ✍️ التمرين (بإيدك — من غير AI)
اعمل فولدر `exercises/06-builtins/`، وجواه فولدر `data/` فيه ملف `orders.json`:
```json
[
  { "id": 1, "customerId": 10, "status": "delivered", "total": 250 },
  { "id": 2, "customerId": 11, "status": "pending",   "total": 120 },
  { "id": 3, "customerId": 10, "status": "cancelled", "total": 80  },
  { "id": 4, "customerId": 12, "status": "delivered", "total": 400 },
  { "id": 5, "customerId": 10, "status": "accepted",  "total": 90  }
]
```

### أ) تمرين 1 بتاع المرحلة: CLI بيطبع إحصائيات (`stats.ts`)
```bash
npx tsx exercises/06-builtins/stats.ts exercises/06-builtins/data/orders.json
```
المطلوب يطبع:
- عدد الأوردرات.
- إجمالي المبيعات (من غير الـ`cancelled`).
- متوسط قيمة الأوردر (من غير الـ`cancelled`).
- عدد الأوردرات لكل status.
- أكتر عميل عمل أوردرات (`customerId`).

والحالات الصعبة:
- لو ماكتبتش اسم ملف ← رسالة واضحة، و`exitCode = 1`.
- لو الملف مش موجود (`ENOENT`) ← "الملف مش موجود" مش stack trace طويل.
- لو الـJSON بايظ ← "الملف مش JSON صالح".
- استخدم `type Order` و`unknown` وتأكد إن الداتا array قبل ما تحسب.

### ب) تمرين 2 بتاع المرحلة: سيرفر HTTP فيه 3 routes (`server.ts`)
بـ`node:http` بس، من غير Express:

| Route | بيعمل إيه |
| --- | --- |
| `GET /health` | `200 {"ok": true}` |
| `GET /orders` | يقرا `data/orders.json` ويرجّعه. ولو فيه `?status=pending` يفلتر |
| `POST /orders` | ياخد `{ customerId, total }`، ويعمل `id` جديد و`status: "pending"`، ويحفظ في الملف، ويرجّع `201` بالأوردر الجديد |
| أي حاجة تانية | `404 {"error": "not found"}` |

والحالات الصعبة لـ`POST`:
- JSON بايظ ← `400`.
- `customerId` أو `total` مش أرقام، أو `total <= 0` ← `400` ومعاه رسالة بالسبب.

جرّبه من terminal تاني:
```powershell
curl.exe http://localhost:3000/health
curl.exe "http://localhost:3000/orders?status=delivered"
curl.exe -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{\"customerId\": 13, \"total\": 75}'
```
> ⚠️ في PowerShell لازم `\"` جوه الـJSON بتاع `-d`. ولو حسيتها معقدة، اكتب `client.ts` بيستخدم `fetch` زي الدرس 04.

### ج) الـevents
- في `server.ts`، اعمل `EventEmitter` بـevent اسمه `"order:created"`.
- `POST /orders` يعمل `emit` بعد الحفظ.
- listener يكتب سطر في `data/orders.log` بـ`appendFile`، فيه الوقت ورقم الأوردر.

> 💡 خلي بالك: الـlistener هيبقى async، و`emit` مش هيستناه، فلازم تمسك الـerror جواه (الدرس 05).

شغّل `npm run typecheck` في الآخر، ولما تخلّص قول **"راجع تمرين 06"**.

---

## ❓ أسئلة مراجعة
1. ليه بنستخدم `path.join` بدل ما نجمع المسارات بـ`+`؟
2. لو كتبت `readFile("data/orders.json")` وشغّلت من فولدر تاني، إيه اللي هيحصل؟ وإيه الحل؟
3. ليه الـbody في `http` بيتقري بـ`for await`، مش بيوصل جاهز؟
4. اذكر 3 حاجات Express بيعملها بدالك، بالمقارنة بالسيرفر اللي عملته بإيدك.
5. `emit` sync ولا async؟ وده بيفرق في إيه؟
6. إمتى ينفع تستخدم `readFileSync`؟ وإمتى ماينفعش؟

---

## 📚 مصادر
- [Node.js — fs/promises](https://nodejs.org/api/fs.html#promises-api)
- [Node.js — path](https://nodejs.org/api/path.html)
- [Node.js — Anatomy of an HTTP Transaction](https://nodejs.org/en/learn/modules/anatomy-of-an-http-transaction) ← **اقراه كله قبل المرحلة 2**
- [Node.js — events](https://nodejs.org/api/events.html)
