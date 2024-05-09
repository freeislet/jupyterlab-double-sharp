import { JupyterFrontEnd } from '@jupyterlab/application';

import { VariableExtension, VariableTracker } from './tracker';

export function setupVariableExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new VariableExtension());
}

export { VariableTracker };
