import { JupyterFrontEnd } from '@jupyterlab/application';

import { CodeInspectorExtension } from './inspector';

export function setupCodeExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CodeInspectorExtension());
}

export { CodeInspector, ICodeVariables } from './inspector';
