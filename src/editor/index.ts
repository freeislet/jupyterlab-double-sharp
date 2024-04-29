import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { setupCommentExtension } from './comment';

export function setupEditorExtensions(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) {
  setupCommentExtension(registry, settings);
}
