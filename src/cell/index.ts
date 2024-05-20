import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { CellExecution } from './execution';
import { CellContext } from './context';
import { CellMetadata } from './metadata';
import { CellStyle } from './style';
import { CellActions } from './actions';
import { ExecutionActions } from '../execution';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
}

export function setupCellExecution() {
  ExecutionActions.beforeExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // console.log('beforeExecution', args);

      args.cells.forEach(cell => CellExecution.prepare(cell));
    }
  );

  // TODO: VariableTracker -> CellTracker 안에 CodeInspector로 포함
  //       afterExecution에서 kernel vars 수집

  CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
    // console.log('cell contentChanged', args);

    const { model } = args;
    CellMetadata.Code.setDirty(model);
  });
}

export function setupCellStyles() {
  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      console.log(args);

      const { cell, change } = args;

      if (!cell) return;

      if (change.key.startsWith('##Config')) {
        CellStyle.update(cell);
      }
    }
  );
}

export { CellExecution, CellContext, CellMetadata, CellActions };
export { CellCode } from './code';
