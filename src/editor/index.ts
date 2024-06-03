import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { setupHighlightExtension } from './highlight';

export function setupEditor(registry: IEditorExtensionRegistry) {
  setupHighlightExtension(registry);
}
