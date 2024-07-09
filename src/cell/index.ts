import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { CellContext } from './context';
import { CellCSMagic, setupCellCSMagic } from './cs-magic';
import { CellCode, setupCellCode } from './code';
import { CellStyle } from './style';
import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { ExecutionActions } from '../execution';
import { CodeInspector } from '../code';
import { metadataKeys } from '../const';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());

  setupCellCSMagic();
  setupCellCode();
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

  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      Log.debug('cell metadataChanged', args);

      const { model, change } = args;
      const cell = CellDictionary.global.getByModel(model);
      const styleRelevantKeys = [
        metadataKeys.config,
        metadataKeys.csmagic,
        metadataKeys.execution
      ];
      if (cell && styleRelevantKeys.includes(change.key)) {
        CellStyle.update(cell);
      }
    }
  );
}

export { CellContext, CellCSMagic, CellCode, CellActions, CellDictionary };
export { CellConfig } from './config';
export { CodeContext } from './code';
export { CellExecution } from './execution';
