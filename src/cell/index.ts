import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
}

export { CellActions, CellActionConnector } from './actions';
export { CellStyle } from './style';
