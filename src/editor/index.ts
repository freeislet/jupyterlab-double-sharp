import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookTracker } from '@jupyterlab/notebook';

import { setupCommentExtension } from './comment';

export function setupEditorExtensions(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings,
  notebookTracker: INotebookTracker
) {
  setupCommentExtension(registry, settings, notebookTracker);
}
