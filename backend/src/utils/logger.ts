/**
 * Simple structured JSON logger (v2 spec §3.9).
 * No heavy dependencies — console.log JSON lines.
 *
 * Key log points tracked:
 *   - chat_request_received
 *   - qwen_api_call (with latency)
 *   - chat_response_sent
 *   - error
 */

export type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  });
  // Use stdout for info/warn, stderr for error — production-friendly
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

/**
 * Convenience wrappers matching common usage throughout the codebase.
 * logger.info(...) / logger.warn(...) / logger.error(...) style.
 */
export const logger = {
  info(event: string, data?: Record<string, unknown>) {
    log('info', event, data);
  },
  warn(event: string, data?: Record<string, unknown>) {
    log('warn', event, data);
  },
  error(event: string, data?: Record<string, unknown>) {
    log('error', event, data);
  },
};

export default logger;
