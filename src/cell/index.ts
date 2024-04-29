import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
// import { WidgetExtension } from './notebook';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
  // app.docRegistry.addWidgetExtension('Notebook', new WidgetExtension());
}
