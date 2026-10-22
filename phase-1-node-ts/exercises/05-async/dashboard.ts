const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface User {
  id: number;
  name: string;
}
type Channel = "email" | "sms" | "push";

async function getUser(id: number): Promise<User> {
  await wait(100);
  return { id, name: `user${id}` };
}

async function getOrders(userId: number): Promise<string[]> {
  await wait(150);
  return [`order-a-${userId}`, `order-b-${userId}`];
}

async function getStats(userId: number): Promise<{ total: number }> {
  await wait(120);
  return { total: userId * 100 };
}

async function sendNotification(userId: number, channel: Channel): Promise<string> {
  await wait(50);
  if (channel === "sms") throw new Error(`sms failed for user ${userId}`);
  return `${channel} sent`;
}

async function loadDashboard(id: number) {
  // 1) needed first: the rest depends on user.id
  const user = await getUser(id);

  // 2) independent and both required -> Promise.all (time = slowest, 150ms)
  const [orders, stats] = await Promise.all([getOrders(user.id), getStats(user.id)]);

  // 3) independent, one failing must not break the others -> allSettled
  const channels: Channel[] = ["email", "sms", "push"];
  const results = await Promise.allSettled(channels.map((c) => sendNotification(user.id, c)));
  const notifications = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : `${channels[i]} failed (${(r.reason as Error).message})`,
  );

  return { user, orders, stats, notifications };
}

const start = Date.now();
const dashboard = await loadDashboard(7);
console.log(dashboard);
console.log(`total: ${Date.now() - start} ms (expected ~300)`);
