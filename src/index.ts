import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { editorExtensionFactory } from './editor';

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp:plugin',
  description: 'Convert comments starting with ## to markdown-like heading',
  autoStart: true,
  requires: [IEditorExtensionRegistry],
  activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

    // Register a new editor configurable extension
    extensions.addExtension(editorExtensionFactory);
  }
};

export default plugin;
