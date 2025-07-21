import { WRITE_DELAY_MS } from "../constants";

let lastWriteTimestamp = 0;

export async function delayedWrite<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const wait = Math.max(0, WRITE_DELAY_MS - (now - lastWriteTimestamp));
  if (wait > 0) await new Promise((res) => setTimeout(res, wait));
  lastWriteTimestamp = Date.now();
  return await fn();
}