interface User {
  id: number;
  name: string;
}

// Fake DB call that takes 200ms
function fetchUser(id: number): Promise<User> {
  return new Promise((resolve) => setTimeout(() => resolve({ id, name: `user${id}` }), 200));
}

const ids = [1, 2, 3, 4, 5];

let start = Date.now();
const sequential: User[] = [];
for (const id of ids) {
  sequential.push(await fetchUser(id)); // waits for each one before starting the next
}
console.log(`for + await:  ${Date.now() - start} ms`, sequential.map((u) => u.name));

start = Date.now();
const parallel = await Promise.all(ids.map((id) => fetchUser(id))); // all start together
console.log(`Promise.all:  ${Date.now() - start} ms`, parallel.map((u) => u.name));
