// Reads every setting from process.env once, converts it to the right type,
// and stops the app at startup if something is missing or wrong.

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`missing env var: ${name}`);
  }
  return value;
}

function toPort(value: string): number {
  const port = Number(value); // "abc" -> NaN, which is not an integer
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got "${value}"`);
  }
  return port;
}

export const config = {
  port: toPort(process.env.PORT ?? "3000"), // optional, defaults to 3000
  ordersFile: required("ORDERS_FILE"), // required
  debug: process.env.DEBUG === "true", // only the exact text "true" is true
};
