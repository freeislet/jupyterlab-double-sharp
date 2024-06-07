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

export class DefaultLogger implements Log.ILogger {
  constructor() {}

  critical(...data: any[]) {
    console.error(...data);
  }

  error(...data: any[]) {
    console.error(...data);
  }

  warning(...data: any[]) {
    console.warn(...data);
  }

  info(...data: any[]) {
    console.log(...data);
  }

  debug(...data: any[]) {
    if (Private.skipLog('debug')) return;

    console.debug(...data);
  }
}

export class Logger implements Log.ILogger {
  constructor(public readonly logger: ILogger) {}

  critical(...data: any[]) {
    this._log('critical', data);
    console.error(...data);
  }

  error(...data: any[]) {
    this._log('error', data);
    console.error(...data);
  }

  warning(...data: any[]) {
    this._log('warning', data);
    console.warn(...data);
  }

  info(...data: any[]) {
    this._log('info', data);
    console.log(...data);
  }

  debug(...data: any[]) {
    if (Private.skipLog('debug')) return;

    this._log('debug', data);
    console.debug(...data);
  }

  _log(level: LogLevel, data: any[]) {
    const text = Private.stringify(data);
    const msg: ITextLog = {
      type: 'text',
      level: level,
      data: text
    };
    this.logger.log(msg);
  }
}

export class Log {
  static readonly instance = new Log();

  static setup(registry: ILoggerRegistry, nbtracker: INotebookTracker) {
    this.instance.set(registry, nbtracker);
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
  private _loggers = new Map<NotebookPanel, Logger>();
  private _defaultLogger = new DefaultLogger();

  get loggers(): ReadonlyMap<NotebookPanel, Log.ILogger> {
    return this._loggers;
  }

  constructor() {}

  set(registry: ILoggerRegistry, nbtracker: INotebookTracker) {
    this._registry = registry;
    this._nbtracker = nbtracker;
  }

  getCurrentLogger(): Log.ILogger {
    const panel = this._nbtracker?.currentWidget;
    return panel ? this.getLogger(panel) : this._defaultLogger;
  }

  getLogger(panel: NotebookPanel): Log.ILogger {
    let logger = this._loggers.get(panel);
    if (!logger) {
      const jllogger = this._registry?.getLogger(panel.context.path);
      if (jllogger) {
        logger = new Logger(jllogger);
        this._loggers.set(panel, logger);
      }
    }
    return logger ?? this._defaultLogger;
  }
}

namespace Private {
  export function skipLog(level: LogLevel): boolean {
    return level === 'debug' && !Settings.settings.verbose.log;
  }

  export function stringify(data: any[], separator = ' '): string {
    return data.map(stringFrom).join(separator);
  }
}

/**
 * Log class global 선언
 */
const _Log = Log;

declare global {
  var Log: typeof _Log;
  interface Log extends InstanceType<typeof Log> {}
}
globalThis.Log = _Log;
