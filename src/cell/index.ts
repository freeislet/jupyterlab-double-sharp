import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { VariableExtension } from './variable';
import { CellActions } from './actions';
import { CellStyle } from './style';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
  app.docRegistry.addWidgetExtension('Notebook', new VariableExtension());
}

export function setupCellStyles() {
  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      console.log(args);

      const { cell, change } = args;

      if (!cell) return;

      if (change.key.startsWith('##')) {
        CellStyle.update(cell);
      }
    }
  );
}

export { CellActions };
