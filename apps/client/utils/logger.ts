export const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[info] [ototabi-client] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`[error] [ototabi-client] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`[warn] [ototabi-client] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) =>
    console.debug(`[debug] [ototabi-client] ${msg}`, ...args),
};
