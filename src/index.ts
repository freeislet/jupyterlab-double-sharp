import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { Settings } from './settings';
import { Log } from './log';
import { setupCommands } from './commands';
import { setupCellExtensions, setupCellActions } from './cell';
import { setupCodeExtensions } from './code';
import { setupExecution } from './execution';
import { setupEditor } from './editor';

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp:plugin',
  description: 'Convert comments starting with ## to markdown-like heading',
  autoStart: true,
  requires: [
    ISettingRegistry,
    ILoggerRegistry,
    ICommandPalette,
    INotebookTracker,
    IEditorExtensionRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    loggerRegistry: ILoggerRegistry,
    commandPalette: ICommandPalette,
    nbtracker: INotebookTracker,
    editorExtensionRegistry: IEditorExtensionRegistry
  ) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log(
          'jupyterlab-double-sharp settings loaded:',
          settings.composite
        );

        Settings.setup(settings);
        Log.setup(loggerRegistry, nbtracker);
        setupCommands(app, commandPalette, nbtracker);
        setupCellExtensions(app);
        setupCellActions();
        setupCodeExtensions(app);
        setupExecution();
        setupEditor(editorExtensionRegistry);
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
