import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { setupHighlightExtension } from './highlight';

export function setupEditor(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) {
  setupHighlightExtension(registry, settings);
}
