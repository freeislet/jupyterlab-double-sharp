import {
  JupyterFrontEnd,
  ILabShell,
  ILayoutRestorer
} from '@jupyterlab/application';
import { CommandRegistry } from '@lumino/commands';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

export namespace App {
  export interface IOptions {
    app: JupyterFrontEnd;
    labshell: ILabShell;
    layoutRestorer?: ILayoutRestorer;
    notebookTracker: INotebookTracker;
  }
}

export interface IAppContext extends Readonly<App.IOptions> {
  readonly commands: CommandRegistry;
  readonly currentNotebook: NotebookPanel | null;
}

export class App implements IAppContext {
  static _instance: App;
  static get instance(): App {
    return this._instance;
  }

  static setup(options: App.IOptions) {
    this._instance = new App(options);
  }

  //----

  private _context: App.IOptions;

  constructor(options: App.IOptions) {
    this._context = options;
  }

  get app(): JupyterFrontEnd {
    return this._context.app;
  }

  get commands(): CommandRegistry {
    return this._context.app.commands;
  }

  get labshell(): ILabShell {
    return this._context.labshell;
  }

  get layoutRestorer(): ILayoutRestorer | undefined {
    return this._context.layoutRestorer;
  }

  get notebookTracker(): INotebookTracker {
    return this._context.notebookTracker;
  }

  get currentNotebook(): NotebookPanel | null {
    return this.notebookTracker.currentWidget;
  }
}
