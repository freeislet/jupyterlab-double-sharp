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

import { PLUGIN_ID } from './const';
import { App } from './app';
import { Settings } from './settings';
import { Log } from './log';
import { setupCellExtensions } from './cell';
import { setupCodeExtensions } from './code';
import { setupExecution } from './execution';
import { setupEditor } from './editor';
import { setupInspectors } from './inspector';

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Execution cache and dependency management extension',
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
    notebookTracker: INotebookTracker,
    editorExtensionRegistry: IEditorExtensionRegistry,
    layoutRestorer?: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log(
          'jupyterlab-double-sharp settings loaded:',
          settings.composite
        );

        App.setup({
          app,
          labshell,
          layoutRestorer,
          commandPalette,
          notebookTracker
        });
        Settings.setup(settings);
        Log.setup(loggerRegistry, notebookTracker);
        setupCellExtensions(app);
        setupCodeExtensions(app);
        setupExecution();
        setupEditor(editorExtensionRegistry);
        setupInspectors(notebookTracker, labshell, layoutRestorer);
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
