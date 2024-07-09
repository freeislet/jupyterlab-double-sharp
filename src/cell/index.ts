import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { setupCellCSMagic } from './cs-magic';
import { setupCellCode } from './code';
import { setupCellStyle } from './style';
import { ExecutionActions } from '../execution';
import { CodeInspector } from '../code';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());

  setupCellCSMagic();
  setupCellCode();
  setupCellStyle();
  setupCellActions();
}

function setupCellActions() {
  ExecutionActions.afterExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // Log.debug('afterExecution', args);

      // kernel variables 업데이트
      const inspector = CodeInspector.getByCells(args.cells);
      inspector?.updateKernelVariables();
    }
  );
}

export { CellContext } from './context';
export { CellConfig } from './config';
export { CellCSMagic } from './cs-magic';
export { CellCode, CodeContext } from './code';
export { CellExecution } from './execution';
export { CellStyle } from './style';
export { CellActions } from './actions';
export { CellDictionary } from './dictionary';
