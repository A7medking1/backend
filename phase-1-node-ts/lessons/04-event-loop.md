# الدرس 04 — Event Loop و Single Thread (أهم درس في الخطة)

> **الهدف:** تفهم إزاي سيرفر Node بـthread واحد بيخدم آلاف الـrequests في نفس الوقت، وإيه بالظبط اللي يخلّيه **يقف** لكل الناس مرة واحدة.
> **الوقت المتوقع:** ساعتين (خد وقتك، ده أهم درس).
> **خبر حلو جدًا:** Dart **نفس الفكرة بالظبط**. فيه thread واحد، وevent loop، وmicrotask queue، و`Isolate` للشغل التقيل. أنت شغال بالكلام ده في Flutter من غير ما تاخد بالك.

> كل الأرقام والنتايج في الدرس ده **اتجربت فعلًا** على Node v24.14.0 على Windows.

---

## 1) Single thread: جرسون واحد في مطعم

تخيّل مطعم فيه **جرسون واحد بس**:
- بياخد الطلب من ترابيزة 1، **يسلّمه للمطبخ**، ويروح على طول لترابيزة 2. مابيقفش جنب المطبخ يستنى الأكل.
- لما الأكل يجهز، المطبخ ينادي عليه فيروح يوصّله.
- كده جرسون واحد بيخدم 50 ترابيزة. ✅

بس لو زبون طلب منه **يقشّر 100 كيلو بطاطس بإيده**، الجرسون هيقف يقشّر، والـ49 ترابيزة التانيين **محدش هيخدمهم** لحد ما يخلّص. ❌

| في المطعم | في Node |
| --- | --- |
| الجرسون | الـ**main thread** اللي بيشغّل الـJS بتاعك |
| المطبخ | نظام التشغيل + الـ**thread pool** بتاع libuv |
| "نادي عليّا لما يجهز" | الـ**callback** / الـ**Promise** |
| تقشير البطاطس | كود **CPU تقيل** (loops، حسابات، `*Sync`) |

**الخلاصة:** Node سريع في الـ**انتظار** (داتابيز، ملفات، network) لأنه مابيستناش بنفسه. وبطيء جدًا في **الحسابات التقيلة** لأن مافيش غير جرسون واحد.

### المقارنة بـFlutter
في Flutter لو عملت loop تقيلة جوه `build()`، الـUI بيـ**freeze** والـframes بتقع. هنا نفس المشكلة بالظبط، بس بدل ما الشاشة تهنّج، **كل المستخدمين** بيستنوا.

---

## 2) مين اللي بيستنى بدالك؟

لما تكتب `await User.findById(id)`، الـJS بيبعت الطلب ويكمّل في شغل تاني. والانتظار نفسه بيحصل في مكان تاني:

| نوع الشغل | مين بيعمله |
| --- | --- |
| Network (HTTP، MongoDB، Redis) | **نظام التشغيل** نفسه، من غير threads خالص |
| `fs` (ملفات)، `crypto.pbkdf2`/`scrypt`، `zlib`، `dns.lookup` | **thread pool** بتاع libuv، فيه **4 threads** افتراضيًا |
| الكود بتاعك (JS) | الـ**main thread**، واحد بس |

### تجربة: الـthread pool فيه 4 بس
```ts
import { pbkdf2 } from "node:crypto";
const start = Date.now();
for (let i = 1; i <= 6; i++) {
  pbkdf2("pw", "salt", 300_000, 64, "sha512", () =>
    console.log(`hash ${i}: ${Date.now() - start}ms`));
}
```
النتيجة على جهازك:
```
hash 3: 115ms
hash 4: 116ms
hash 1: 121ms
hash 2: 125ms
hash 5: 257ms   ← استنى لحد ما thread يفضى
hash 6: 258ms
```
أول 4 خلصوا مع بعض، والـ5 والـ6 **استنوا دورهم**. ولو كبّرت الـpool:
```powershell
$env:UV_THREADPOOL_SIZE=6; npx tsx exercises/04-event-loop/pool.ts
```
هتلاقي التحسن واضح: الستة كلهم خلصوا بين **141 و204ms**، بدل ما الأخيرين ياخدوا **257ms**.

> ⚠️ **الترتيب** اللي بيخلصوا بيه (3، 4، 1، 2) **مش ثابت**. كل ما تشغّل هيطلع مختلف، لأن الـthreads بتشتغل بالتوازي.

---

## 3) الـEvent Loop: إيه اللي بيشتغل إمتى

الـevent loop عبارة عن loop بتلف على **طوابير** (queues). في كل لفة بتمشي على مراحل:

```
   ┌──────────────────────────┐
┌─>│  timers                  │  ← setTimeout / setInterval اللي وقتها جه
│  ├──────────────────────────┤
│  │  poll (I/O)              │  ← callbacks بتاعة fs / network / DB
│  ├──────────────────────────┤
│  │  check                   │  ← setImmediate
│  ├──────────────────────────┤
└──┤  close                   │  ← socket.on("close")
   └──────────────────────────┘

بعد كل callback، قبل اللي بعده:
   1. process.nextTick queue  ← كله
   2. microtask queue         ← كله (Promise.then / await / queueMicrotask)
```

**أهم قاعدة:** الـ**microtasks** (الـPromises) بتتنفّذ **كلها** بعد كل callback وقبل ما الـloop يكمّل. يعني الـPromises دايمًا بتسبق `setTimeout` و`setImmediate`.

### المقارنة بـDart (نفس الفكرة بالظبط!)
| Dart | Node |
| --- | --- |
| microtask queue (`scheduleMicrotask`, `.then` على Future خلصت) | microtask queue (`Promise.then`, `queueMicrotask`) |
| event queue (`Future(() {...})`, `Timer`, I/O) | timers / poll / check |
| — | `process.nextTick` (حاجة خاصة بـNode) |
| `Isolate.run()` / `compute()` | `worker_threads` |

---

## 4) لغز الترتيب 🧩

قبل ما تقرا الإجابة، **اكتب في ورقة** إيه اللي هيتطبع وبالترتيب:
```ts
console.log("A sync start");
setTimeout(() => console.log("B setTimeout 0"), 0);
setImmediate(() => console.log("C setImmediate"));
Promise.resolve().then(() => console.log("D promise.then"));
queueMicrotask(() => console.log("E queueMicrotask"));
process.nextTick(() => console.log("F nextTick"));
console.log("G sync end");
```

<details>
<summary>الإجابة (اضغط بعد ما تكتب توقعك)</summary>

**النتيجة الحقيقية في مشروعنا (ESM):**
```
A sync start
G sync end
D promise.then
E queueMicrotask
F nextTick
B setTimeout 0      ← ⚠️ ممكن يتبدل مع C
C setImmediate
```

**نفس الكود لو الملف CommonJS (`.cjs`):**
```
A sync start
G sync end
F nextTick          ← ⚠️ هنا nextTick جه الأول!
D promise.then
E queueMicrotask
C setImmediate
B setTimeout 0
```

**الشرح:**
1. **الـsync الأول دايمًا** (A, G). الـcall stack لازم يفضى قبل أي حاجة.
2. **الـmicrotasks بعدها** (D, E, F) وقبل أي timer.
3. **ليه `nextTick` اتأخر في ESM؟** 🤯 ده مرتبط بالدرس 03: الـESM module نفسه بيتنفّذ **جوه microtask**. فالـPromises اللي اتعملت في أول الملف بتخلص في نفس الطابور، قبل ما Node يوصل لطابور `nextTick`. أما في CJS، أو جوه أي callback عادي، فـ`nextTick` بيسبق الـPromises:
   ```ts
   setTimeout(() => {
     Promise.resolve().then(() => console.log("promise"));
     process.nextTick(() => console.log("nextTick"));
   }, 0);
   // ← nextTick, promise
   ```
4. **`setTimeout 0` vs `setImmediate` في أول الملف: عشوائي!** شغّلت الكود 8 مرات وطلع `I T` مرة و`T I` سبع مرات. السبب إن الـ`0` فعليًا `1ms`، والنتيجة بتعتمد على الجهاز كان مشغول قد إيه.
   أما **جوه I/O callback** فالترتيب ثابت 100%، و`setImmediate` الأول:
   ```ts
   readFile(file, () => {
     setTimeout(() => console.log("timeout"), 0);
     setImmediate(() => console.log("immediate"));
   });
   // immediate, timeout   ← دايمًا (جرّبتها 5 مرات)
   ```
   والسبب إن بعد مرحلة الـpoll على طول بتيجي مرحلة الـcheck (`setImmediate`)، وبعدها الـloop بيلف تاني للـtimers.

**الدرس العملي:** ماتكتبش كود **يعتمد** على ترتيب `nextTick` و`Promise`، أو `setTimeout 0` و`setImmediate`. لو حاجة لازم تحصل بعد حاجة، استخدم `await`.
</details>

---

## 5) إزاي تقفّل السيرفر لكل الناس (Blocking) 🚨

ده سيرفر بـ`http` بس، فيه route تقيل:
```ts
import http from "node:http";

http.createServer((req, res) => {
  if (req.url === "/slow") {
    const end = Date.now() + 3000;
    while (Date.now() < end) {}        // ← 3 ثواني CPU (تقشير البطاطس)
    return res.end("slow done\n");
  }
  res.end("fast\n");
}).listen(3999);
```

**التجربة:** بعتنا `/slow`، وبعدها بـ100ms بعتنا `/fast`:
```
/fast waited 2907 ms   ← 😱 route مافيهوش أي شغل، استنى 3 ثواني!
/slow total 3047 ms
```
`/fast` ماعملش أي حاجة، بس الجرسون كان مشغول. **كل** المستخدمين استنوا: الـlogin، والـhealth check، كله.

### إيه اللي بيعمل blocking في الحقيقة؟
- loops كبيرة على arrays ضخمة (مثلًا `for` على 1,000,000 عنصر جوه request).
- `JSON.parse` / `JSON.stringify` لداتا كبيرة جدًا.
- أي function بتنتهي بـ**`Sync`**: `readFileSync`، `pbkdf2Sync`، `bcrypt.hashSync`.
- Regex معمول غلط على نص طويل.
- ضغط صور أو PDF على الـmain thread.

### 🔍 مثال من مشروع salla
في `databases/models/user.model.js`:
```js
this.password = bcrypt.hashSync(this.password, Number(process.env.ROUND));
```
`hashSync` بتعمل الـhashing على الـ**main thread**. ولو `ROUND` مثلًا 10 أو 12، كل تسجيل أو تغيير باسورد بيوقّف السيرفر **لكل الناس** عشرات أو مئات الـmilliseconds. ولو 20 مستخدم سجّلوا مع بعض، الكل هيحس بالبطء.
الحل سطر واحد: `await bcrypt.hash(...)`. النسخة دي بتبعت الشغل للـthread pool، فالجرسون يكمّل شغله.

> 📏 **قاعدة في السيرفر:** أي `*Sync` جوه request handler غلط. مسموح بيها بس **وقت الـstartup** (قبل `listen`)، زي قراية ملف config مرة واحدة.

---

## 6) الحل: ابعت الشغل التقيل لـthread تاني

### `worker_threads` = `Isolate.run()` في Dart
```ts
// heavy-worker.ts  ← بيشتغل في thread لوحده
import { parentPort, workerData } from "node:worker_threads";

const end = Date.now() + workerData.ms;
while (Date.now() < end) {}
parentPort?.postMessage("slow done");
```
```ts
// server.ts
import http from "node:http";
import { Worker } from "node:worker_threads";

function runHeavy(ms: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./heavy-worker.ts", import.meta.url), {
      workerData: { ms },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
}

http.createServer(async (req, res) => {
  if (req.url === "/slow") {
    const result = await runHeavy(3000);   // الجرسون مش مستني
    return res.end(result + "\n");
  }
  res.end("fast\n");
}).listen(3999);
```
**نفس التجربة بعد الحل:**
```
/fast waited 7 ms      ← ✅ (كان 2907)
/slow total 3065 ms    ← لسه 3 ثواني، بس محدش تاني اتأثر
```
> 💡 `tsx` بيشغّل ملف الـworker بـ`.ts` عادي (جرّبتها). وفي الـproduction، بعد الـbuild، الامتداد هيبقى `.js`.

### حلول تانية (هتشوفها في الشغل)
| الحل | إمتى |
| --- | --- |
| استخدم النسخة الـasync (`bcrypt.hash`، `fs.promises`) | دايمًا لو موجودة. أسهل حل. |
| `worker_threads` | حساب CPU تقيل لازم يتعمل جوه الـrequest |
| Queue (زي BullMQ) + process تاني | شغل طويل ممكن يخلص بعدين (صور، إيميلات، تقارير). هنشوفه في المرحلة 7. |
| تقسيم الـloop على حتت بـ`setImmediate` | نادرًا. بيدّي فرصة للـrequests التانية بين كل حتة والتانية. |

---

## 7) `await` جوه `for` vs `Promise.all` (الـCheckpoint بتاع المرحلة)

```ts
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ❌ واحدة ورا التانية
for (const id of [1, 2, 3]) {
  await wait(300);           // بيستنى دي تخلص قبل ما يبدأ اللي بعدها
}
// for+await: 936 ms

// ✅ التلاتة مع بعض
await Promise.all([1, 2, 3].map(() => wait(300)));
// Promise.all: 312 ms
```
**ليه؟** `await` جوه الـloop معناها "ماتبعتش الطلب الجاي **قبل** ما ده يرجع". فالانتظار بيتجمّع: 300 + 300 + 300.
أما `Promise.all` فبتبعت التلاتة **مع بعض**، والمطبخ بيشتغل عليهم بالتوازي، فبتستنى **أطول واحد** بس.

| استخدم | لما |
| --- | --- |
| `Promise.all` | العمليات **مستقلة** عن بعض (هات 3 users، هات الأوردرات والإحصائيات مع بعض) |
| `for` + `await` | كل خطوة **محتاجة نتيجة** اللي قبلها، أو لازم تعمل الحاجات بالترتيب (زي تخصم من المخزن، وبعدين تعمل الأوردر) |

> 🔍 في salla، `dropDatabase` بيستخدم `Promise.all` لمسح 19 collection مع بعض. ده **استخدام صح**، لأنهم مستقلين عن بعض.

(هنعمق في `Promise.all` و`allSettled` والـerrors في الدرس 05.)

---

## ✍️ التمرين (بإيدك — من غير AI)
اعمل فولدر `exercises/04-event-loop/`.

### أ) اللغز
1. اكتب كود اللغز (قسم 4) في `order.ts`. **قبل ما تشغّله**، اكتب توقعك في كومنت فوق الكود.
2. شغّله بـ`npx tsx exercises/04-event-loop/order.ts` وقارن النتيجة بتوقعك.
3. انسخه لملف `order.cjs`، وشغّله بـ`node exercises/04-event-loop/order.cjs`. إيه اللي اتغيّر؟

### ب) قفّل السيرفر بإيدك (تمرين 3 في خطة المرحلة)
1. اكتب `blocking-server.ts`: سيرفر `http` فيه route اسمه `/fast` وroute اسمه `/slow` (loop لمدة **5 ثواني**).
2. شغّله في terminal.
3. افتح **terminal تاني** وابعت `/slow`. وفي **terminal تالت**، على طول بعده، ابعت `/fast`:
   ```powershell
   curl.exe http://localhost:3999/slow
   ```
   ```powershell
   curl.exe http://localhost:3999/fast
   ```
   > ⚠️ في PowerShell 5.1 اكتب `curl.exe` مش `curl`، لأن `curl` هناك اختصار لـ`Invoke-WebRequest`.
4. سجّل `/fast` أخد وقت قد إيه. (💡 تقدر تقيسها كده: `Measure-Command { curl.exe http://localhost:3999/fast }`)

### ج) صلّحه بـ`worker_threads`
- انقل الـloop لملف `heavy-worker.ts`، واعمل `/slow` يستخدمه زي قسم 6.
- كرّر نفس التجربة. `/fast` بقى ياخد كام؟

### د) الـthread pool
- اكتب `pool.ts` (قسم 2)، وشغّله مرة عادي ومرة بـ`$env:UV_THREADPOOL_SIZE=6;`.
- غيّر العدد لـ8 hashes. إيه اللي حصل للـ4 الأخيرين؟

### هـ) بونص: الـCheckpoint
اكتب `sequential-vs-parallel.ts` يجيب 5 "users" وهميين، كل واحد بياخد 200ms (بـ`setTimeout`). مرة بـ`for` + `await` ومرة بـ`Promise.all`، واطبع الوقت بتاع كل طريقة.

ولما تخلّص قول **"راجع تمرين 04"**.

---

## ❓ أسئلة مراجعة
1. Node بـthread واحد. إزاي بيخدم 1000 request في نفس الوقت؟ (اشرح بمثال الجرسون أو بكلامك)
2. إيه الفرق بين `await User.find()` و `bcrypt.hashSync()` من ناحية الـmain thread؟
3. ليه `/fast` استنى 3 ثواني في تجربة قسم 5، رغم إنه مابيعملش حاجة؟
4. رتّب: `setTimeout(0)`، `Promise.then`، `console.log`. ومين فيهم ممكن ترتيبه يتغير مع `setImmediate`؟
5. **(الـCheckpoint بتاع المرحلة)** ليه `await` جوه `for` loop ممكن يكون بطيء؟ وإمتى تستخدم `Promise.all` بداله؟ وإمتى **ماينفعش** تستخدمه؟
6. إيه المقابل بتاع `worker_threads` في Flutter؟ وإمتى بتحتاجه هنا وهناك؟

---

## 📚 مصادر
- [Node.js — The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js — Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) ← **اقراه كله**
- [Node.js — worker_threads](https://nodejs.org/api/worker_threads.html)
- [Dart — Concurrency (Event loop & Isolates)](https://dart.dev/language/concurrency): قارن بنفسك
- 🎥 [Philip Roberts — What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ) (JSConf، 26 دقيقة، أشهر شرح)
