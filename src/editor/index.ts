import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { setupHighlightExtension } from './highlight';
import { setupStatementModule } from './statement';

export function setupEditor(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) {
  setupHighlightExtension(registry, settings);
  setupStatementModule();
}
