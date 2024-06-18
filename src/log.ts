import {
  ILoggerRegistry,
  ILogger,
  ITextLog,
  LogLevel
} from '@jupyterlab/logconsole';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { Settings } from './settings';
import { stringFrom } from './utils/object';

export namespace Log {
  export interface ILogger {
    critical(...data: any[]): void;
    error(...data: any[]): void;
    warning(...data: any[]): void;
    info(...data: any[]): void;
    debug(...data: any[]): void;
  }
}

export class Logger implements Log.ILogger {
  constructor(
    public readonly logger: ILogger,
    public readonly manager: Log
  ) {}

  critical(...data: any[]) {
    this.manager.log('critical', data, this.logger);
  }

  error(...data: any[]) {
    this.manager.log('error', data, this.logger);
  }

  warning(...data: any[]) {
    this.manager.log('warning', data, this.logger);
  }

  info(...data: any[]) {
    this.manager.log('info', data, this.logger);
  }

  debug(...data: any[]) {
    this.manager.log('debug', data, this.logger);
  }
}

export class DefaultLogger implements Log.ILogger {
  constructor(public readonly manager: Log) {}

  critical(...data: any[]) {
    this.manager.log('critical', data);
  }

  error(...data: any[]) {
    this.manager.log('error', data);
  }

  warning(...data: any[]) {
    this.manager.log('warning', data);
  }

  info(...data: any[]) {
    this.manager.log('info', data);
  }

  debug(...data: any[]) {
    this.manager.log('debug', data);
  }
}

export class Log {
  static readonly instance = new Log();

  static setup(registry: ILoggerRegistry, nbtracker: INotebookTracker) {
    this.instance.set(registry, nbtracker);

    this.instance.verbose = Settings.data.verbose.log;
    Settings.verboseChanged.connect((_, change) => {
      this.instance.verbose = change.newValue.log;
    });
  }

  static get(panel: NotebookPanel): Log.ILogger {
    return this.instance.getLogger(panel);
  }

  static get current(): Log.ILogger {
    return this.instance.getCurrentLogger();
  }

  static critical(...data: any[]) {
    this.current.critical(...data);
  }

  static error(...data: any[]) {
    this.current.error(...data);
  }

  static warning(...data: any[]) {
    this.current.warning(...data);
  }

  static info(...data: any[]) {
    this.current.info(...data);
  }

  static debug(...data: any[]) {
    this.current.debug(...data);
  }

  //----

  private _registry?: ILoggerRegistry;
  private _nbtracker?: INotebookTracker;
  private _loggers = new Map<NotebookPanel | null, Logger>();
  private _defaultLogger = new DefaultLogger(this);
  private _verbose = false;

  get loggers(): ReadonlyMap<NotebookPanel | null, Log.ILogger> {
    return this._loggers;
  }

  get verbose(): boolean {
    return this._verbose;
  }
  set verbose(value: boolean) {
    this._verbose = value;
  }

  constructor() {}

  set(registry: ILoggerRegistry, nbtracker: INotebookTracker) {
    this._registry = registry;
    this._nbtracker = nbtracker;
  }

  getCurrentLogger(): Log.ILogger {
    const panel = this._nbtracker?.currentWidget;
    return this.getLogger(panel);
  }

  getLogger(panel?: NotebookPanel | null): Log.ILogger {
    panel = panel ?? null;

    let logger = this._loggers.get(panel);
    if (!logger) {
      const source = panel?.context.path ?? '';
      const jllogger = this._registry?.getLogger(source);
      if (jllogger) {
        logger = new Logger(jllogger, this);
        this._loggers.set(panel, logger);
      }
    }
    return logger ?? this._defaultLogger;
  }

  log(level: LogLevel, data: any[], logger?: ILogger) {
    if (level === 'debug' && !this.verbose) return;

    if (logger) {
      const text = Private.stringify(data);
      const msg: ITextLog = {
        type: 'text',
        level: level,
        data: text
      };
      logger.log(msg);
    }

    const consoleLogs = {
      critical: console.error,
      error: console.error,
      warning: console.warn,
      info: console.log,
      debug: console.debug
    };
    consoleLogs[level]?.(...data);
  }
}

namespace Private {
  export function stringify(data: any[], separator = ' '): string {
    return data.map(stringFrom).join(separator);
  }
}

/**
 * Log class global 선언
 */
const _Log = Log;

declare global {
  // eslint-disable-next-line no-var
  var Log: typeof _Log;
  type Log = InstanceType<typeof Log>;
}
globalThis.Log = _Log;
