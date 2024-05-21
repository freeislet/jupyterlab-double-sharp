import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { setupCellExtensions, setupCellActions } from './cell';
import { setupEditor } from './editor';
import { setupExecution } from './execution';
import { setupVariableExtensions } from './variable';

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp:plugin',
  description: 'Convert comments starting with ## to markdown-like heading',
  autoStart: true,
  requires: [ISettingRegistry, IEditorExtensionRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    editorExtensionRegistry: IEditorExtensionRegistry
  ) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

    setupVariableExtensions(app);
    setupCellExtensions(app);
    setupCellActions();
    setupExecution();

    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log(
          'jupyterlab-double-sharp settings loaded:',
          settings.composite
        );

        setupEditor(editorExtensionRegistry, settings);
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
