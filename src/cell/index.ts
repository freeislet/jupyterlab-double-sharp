import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { CellContext } from './context';
import { CellMetadata } from './metadata';
import { CellStyle } from './style';
import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { ExecutionActions } from '../execution';
import { CSMagicExecutor } from '../cs-magic';
import { CodeInspector } from '../code';

export function setupCellExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
}

export function setupCellActions() {
  ExecutionActions.beforeExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // console.log('beforeExecution', args);

      // 셀 실행 준비
      for (const cell of args.cells) {
        /**
         * ##% client-side magic command 실행
         * - ##ConfigOverride metadata 업데이트 (skip, cache, ...)
         * - load -> 셀 추가
         */
        CSMagicExecutor.execute(cell.model);
      }
    }
  );

  ExecutionActions.afterExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // console.log('afterExecution', args);

      // kernel variables 업데이트
      const inspector = CodeInspector.getByCells(args.cells);
      inspector?.updateKernelVariables();
    }
  );

  CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
    console.log('cell contentChanged', args);

    const { model } = args;

    CellMetadata.configOverride.setDirty(model);
    CellMetadata.code.setDirty(model);
  });

  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      console.log('cell metadataChanged', args);

      const { model, change } = args;

      // ##Config, ##ConfigOverride 변경 시 cell style 업데이트
      if (change.key.startsWith('##Config')) {
        const cell = CellDictionary.global.getByModel(model);
        if (cell) {
          CellStyle.update(cell);
        }
      }
    }
  );
}

export { CellContext, CellActions, CellDictionary };
export { CellConfig } from './config';
export { CellCode, CodeContext } from './code';
