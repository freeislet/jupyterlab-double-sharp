import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { Log } from './log';
import { Settings } from './settings';
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
    INotebookTracker,
    IEditorExtensionRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    loggerRegistry: ILoggerRegistry,
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

        Log.setup(loggerRegistry, nbtracker);
        Settings.setup(settings);
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
