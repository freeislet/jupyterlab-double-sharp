import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { CommandRegistration } from './command';
import { Settings } from './settings';
import { Log } from './log';
import { setupCellExtensions, setupCellActions } from './cell';
import { setupCodeExtensions } from './code';
import { setupExecution } from './execution';
import { setupEditor } from './editor';
import { setupInspectors } from './inspector';

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp:plugin',
  description: 'Convert comments starting with ## to markdown-like heading',
  autoStart: true,
  requires: [
    ILabShell,
    ICommandPalette,
    ISettingRegistry,
    ILoggerRegistry,
    INotebookTracker,
    IEditorExtensionRegistry
  ],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    labshell: ILabShell,
    commandPalette: ICommandPalette,
    settingRegistry: ISettingRegistry,
    loggerRegistry: ILoggerRegistry,
    nbtracker: INotebookTracker,
    editorExtensionRegistry: IEditorExtensionRegistry,
    restorer?: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log(
          'jupyterlab-double-sharp settings loaded:',
          settings.composite
        );

        CommandRegistration.begin(app.commands, commandPalette);
        Settings.setup(settings);
        Log.setup(loggerRegistry, nbtracker);
        setupCellExtensions(app);
        setupCellActions();
        setupCodeExtensions(app);
        setupExecution();
        setupEditor(editorExtensionRegistry);
        setupInspectors(labshell, restorer);
        CommandRegistration.end();
      })
      .catch(reason => {
        console.error(
          'Failed to load settings for jupyterlab-double-sharp.',
          reason
        );
      });
  }
};

export default plugin;
export * from './icon';
