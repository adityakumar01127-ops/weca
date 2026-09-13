type LogLevel = "info" | "warn" | "error" | "critical";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Structured JSON logger for production.
 * 
 * Outputs JSON lines to stdout (captured by Vercel Logs, Datadog, etc.)
 * In development, outputs human-readable format.
 */
class Logger {
  private context: Partial<LogEntry> = {};

  /** Create a child logger with attached context (requestId, userId, endpoint) */
  withContext(ctx: Partial<Pick<LogEntry, "requestId" | "userId" | "endpoint">>): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...ctx };
    return child;
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log("error", message, metadata);
  }

  critical(message: string, metadata?: Record<string, unknown>) {
    this.log("critical", message, metadata);
  }

  /** Log an API request with timing */
  request(method: string, path: string, status: number, durationMs: number, metadata?: Record<string, unknown>) {
    this.log("info", `${method} ${path} ${status}`, {
      ...metadata,
      method,
      path,
      status,
      durationMs,
    });
  }

  /** Log an error with stack trace */
  exception(error: unknown, message?: string, metadata?: Record<string, unknown>) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log("error", message || err.message, {
      ...metadata,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
    });
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...(metadata ? { metadata } : {}),
    };

    if (process.env.NODE_ENV === "production") {
      // Structured JSON for log aggregation
      const output = JSON.stringify(entry);
      if (level === "error" || level === "critical") {
        console.error(output);
      } else if (level === "warn") {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Human-readable in development
      const prefix = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        critical: "🔥",
      }[level];

      const parts = [
        `${prefix} [${level.toUpperCase()}]`,
        message,
        this.context.endpoint ? `| ${this.context.endpoint}` : "",
        this.context.userId ? `| user:${this.context.userId.slice(0, 8)}` : "",
        metadata ? `| ${JSON.stringify(metadata)}` : "",
      ].filter(Boolean);

      if (level === "error" || level === "critical") {
        console.error(parts.join(" "));
      } else if (level === "warn") {
        console.warn(parts.join(" "));
      } else {
        console.log(parts.join(" "));
      }
    }
  }
}

/** Generate a simple request ID */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Singleton logger instance */
export const logger = new Logger();

export type { LogLevel, LogEntry, Logger };
