// Privy's embedded wallet signs with Node's Buffer, which browsers don't have
// ("Buffer is not defined" on the first email / Google wallet transaction).
import { Buffer } from 'buffer'

const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
g.Buffer ??= Buffer
