import {
  JupyterFrontEnd,
  ILabShell,
  ILayoutRestorer
} from '@jupyterlab/application';
import { CommandRegistry } from '@lumino/commands';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { addCommand, addCommandPalette } from './utils/command';

export namespace App {
  export interface IOptions {
    app: JupyterFrontEnd;
    labshell: ILabShell;
    layoutRestorer?: ILayoutRestorer;
    commandPalette: ICommandPalette;
    notebookTracker: INotebookTracker;
  }

  export interface IJLabContext extends IOptions {
    commands: CommandRegistry;
    currentNotebook: NotebookPanel | null;
  }
}

export class App {
  static setup(options: App.IOptions) {
    this._instance = new App(options);
  }

  static _instance: App;
  static get instance(): App {
    return this._instance;
  }

  //----

  public readonly jlab: Readonly<App.IJLabContext>;

  constructor(options: App.IOptions) {
    this.jlab = {
      ...options,
      get commands() {
        return this.app.commands;
      },
      get currentNotebook() {
        return this.notebookTracker.currentWidget;
      }
    };
  }

  get commands(): CommandRegistry {
    return this.jlab.commands;
  }

  get notebookTracker(): INotebookTracker {
    return this.jlab.notebookTracker;
  }

  get currentNotebook(): NotebookPanel | null {
    return this.notebookTracker.currentWidget;
  }

  addCommand(
    id: string,
    options: CommandRegistry.ICommandOptions,
    keyBindingOptions?: PartialPick<
      CommandRegistry.IKeyBindingOptions,
      'command'
    >
  ) {
    addCommand(this.commands, id, options, keyBindingOptions);
    addCommandPalette(this.jlab.commandPalette, { command: id });
  }

  openSettings() {
    this.commands.execute('settingeditor:open', {
      query: 'Double Sharp'
    });
  }

  openDocument() {
    const newWindow = window.open(
      'https://github.com/freeislet/jupyterlab-double-sharp#jupyterlab_double_sharp',
      '_blank',
      'noopener,noreferrer'
    );
    if (newWindow) {
      newWindow.opener = null;
    }
  }
}
