import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { CellExecution } from './execution';
import { CellActions } from './actions';
import { CellStyle } from './style';
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
}

export function setupCellStyles() {
  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      // console.log(args);

      const { cell, change } = args;

      if (!cell) return;

      if (change.key.startsWith('##Config')) {
        CellStyle.update(cell);
      }
    }
  );
}

export { CellExecution, CellActions };
export { CellMetadata } from './metadata';
export { CellConfig } from './config';
export { CellCode } from './code';
