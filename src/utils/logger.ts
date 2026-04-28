class Logger {
  private static _instance: Logger;

  private readonly _level: Logger.Level = Logger._fromEnv();

  private constructor() {}

  static get(): Logger {
    if (!this._instance) {
      this._instance = new Logger();
    }

    return this._instance;
  }

  debug(...args: unknown[]): void {
    this._emit(Logger.Level.debug, args);
  }

  info(...args: unknown[]): void {
    this._emit(Logger.Level.info, args);
  }

  warn(...args: unknown[]): void {
    this._emit(Logger.Level.warn, args);
  }

  error(...args: unknown[]): void {
    this._emit(Logger.Level.error, args);
  }

  private static _fromEnv(): Logger.Level {
    const env = process.env.LOG_LEVEL?.toLowerCase();
    if (env && env in Logger.Level) {
      return Logger.Level[env as keyof typeof Logger.Level];
    }
    return Logger.Level.info;
  }

  private _emit(level: Logger.Level, args: unknown[]): void {
    if (level < this._level) return;
    const name = Logger.Level[level] as keyof typeof Logger.Level;
    const method = name === "debug" ? "log" : name;

    console[method](
      `[${name.toUpperCase()}]`.padEnd(Logger.LABEL_PAD + 2),
      ...args,
    );
  }
}

namespace Logger {
  export enum Level {
    debug,
    info,
    warn,
    error,
  }

  export const LABEL_PAD = Math.max(
    ...Object.keys(Logger.Level).map((k) => k.length),
  );
}

export default Logger;
