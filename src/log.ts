import {
  ILoggerRegistry,
  ILogger,
  ITextLog,
  LogLevel
} from '@jupyterlab/logconsole';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';

export class Log {
  private static _instance?: Log;

  static setup(registry: ILoggerRegistry, nbtracker: INotebookTracker) {
    this._instance = new Log(registry, nbtracker);
  }

  static get instance(): Log {
    if (!this._instance) throw Error('Log instance is not initialized.');
    return this._instance;
  }

  static get(panel: NotebookPanel): Logger {
    return this.instance.getLogger(panel);
  }

  static get current(): Logger | undefined {
    return this.instance.getCurrentLogger();
  }

  static critical(...data: any[]) {
    this.current?.critical(...data);
  }

  static error(...data: any[]) {
    this.current?.error(...data);
  }

  static warning(...data: any[]) {
    this.current?.warning(...data);
  }

  static info(...data: any[]) {
    this.current?.info(...data);
  }

  static debug(...data: any[]) {
    this.current?.debug(...data);
  }

  //----

  public readonly loggers = new Map<NotebookPanel, Logger>();

  constructor(
    public readonly registry: ILoggerRegistry,
    public readonly nbtracker: INotebookTracker
  ) {}

  getCurrentLogger(): Logger | undefined {
    const panel = this.nbtracker.currentWidget;
    if (panel) {
      return this.getLogger(panel);
    }
  }

  getLogger(panel: NotebookPanel): Logger {
    let logger = this.loggers.get(panel);
    if (!logger) {
      const ilogger = this.registry.getLogger(panel.context.path);
      logger = new Logger(ilogger);
      this.loggers.set(panel, logger);
    }
    return logger;
  }
}

export class Logger {
  constructor(public readonly logger: ILogger) {}

  critical(...data: any[]) {
    const text = this._stringify(data);
    this._log('critical', text);

    console.error(...data);
  }

  error(...data: any[]) {
    const text = this._stringify(data);
    this._log('error', text);

    console.error(...data);
  }

  warning(...data: any[]) {
    const text = this._stringify(data);
    this._log('warning', text);

    console.warn(...data);
  }

  info(...data: any[]) {
    const text = this._stringify(data);
    this._log('info', text);

    console.log(...data);
  }

  debug(...data: any[]) {
    const text = this._stringify(data);
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

  _stringify(data: any[], separator = ' '): string {
    function toString(obj: any) {
      let str = obj.toString();
      if (str.startsWith('[object')) {
        try {
          str = JSON.stringify(obj, (key, value) => {
            return value instanceof Set
              ? [...value]
              : value instanceof Map
                ? Object.fromEntries(value)
                : value instanceof Widget
                  ? `<${typeof value}>${value.title} (${value.id})`
                  : value;
          });
        } catch {}
      }
      return str;
    }

    return data.map(x => toString(x)).join(separator);
  }
}
