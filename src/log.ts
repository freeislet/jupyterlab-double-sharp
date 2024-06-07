import {
  ILoggerRegistry,
  ILogger,
  ITextLog,
  LogLevel
} from '@jupyterlab/logconsole';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

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
    console.debug(...data);
  }
}

export class Logger implements Log.ILogger {
  constructor(public readonly logger: ILogger) {}

  critical(...data: any[]) {
    const text = Private.stringify(data);
    this._log('critical', text);

    console.error(...data);
  }

  error(...data: any[]) {
    const text = Private.stringify(data);
    this._log('error', text);

    console.error(...data);
  }

  warning(...data: any[]) {
    const text = Private.stringify(data);
    this._log('warning', text);

    console.warn(...data);
  }

  info(...data: any[]) {
    const text = Private.stringify(data);
    this._log('info', text);

    console.log(...data);
  }

  debug(...data: any[]) {
    const text = Private.stringify(data);
    this._log('debug', text);

    console.debug(...data);
  }

  _log(level: LogLevel, text: string) {
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
