import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
}

export { CellActions } from './actions';
export { CellStyle, setupCellStyles } from './style';
