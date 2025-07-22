import { sendAgentMessage, buildAgentPayload } from "../agent";

const navigationBuffer = new Set<string>();
const sentMessages = new Set<string>();

export function addToNavigationBuffer(message: string): void {
  navigationBuffer.add(message);
}

export function trimNavigationBuffer(maxSize = 8): void {
  if (navigationBuffer.size <= maxSize) return;
  const all = Array.from(navigationBuffer);
  const trimmed = all.slice(-maxSize);
  navigationBuffer.clear();
  trimmed.forEach((msg) => navigationBuffer.add(msg));
}

export async function flushNavigationBuffer(): Promise<void> {
  if (navigationBuffer.size === 0) return;
  
  for (const msg of navigationBuffer) {
    const trimmed = msg.trim();
    if (!trimmed || sentMessages.has(trimmed)) continue;
    const payload = buildAgentPayload(trimmed);
    await sendAgentMessage(payload);
    sentMessages.add(trimmed);
  }
  navigationBuffer.clear();
}

export function getNavigationBufferSize(): number {
  return navigationBuffer.size;
}