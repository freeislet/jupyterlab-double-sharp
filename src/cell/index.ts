import { JupyterFrontEnd } from '@jupyterlab/application';

import { CellExtension } from './tracker';
import { CellContext } from './context';
import { CellMetadata } from './metadata';
import { CellStyle } from './style';
import { CellActions } from './actions';
import { ExecutionActions } from '../execution';
import { CSMagicExecutor } from '../cs-magic';

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
        CSMagicExecutor.execute(cell);
      }
    }
  );

  // TODO: afterExecution에서 CodeInspector kernel vars 수집

  CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
    // console.log('cell contentChanged', args);

    const { model } = args;
    CellMetadata.ConfigOverride.setDirty(model);
    CellMetadata.Code.setDirty(model);
  });

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

export { CellContext, CellActions };
export { CellConfig } from './config';
export { CodeContext } from './code';
