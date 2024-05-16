import { JupyterFrontEnd } from '@jupyterlab/application';

import { VariableExtension, VariableTracker, ICellVariables } from './tracker';

export function setupVariableExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new VariableExtension());
}

export { VariableTracker, ICellVariables };
