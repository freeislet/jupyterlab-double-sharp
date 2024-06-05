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
      // Log.debug('beforeExecution', args);

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
      // Log.debug('afterExecution', args);

      // kernel variables 업데이트
      const inspector = CodeInspector.getByCells(args.cells);
      inspector?.updateKernelVariables();
    }
  );

  CellActions.sourceChanged.connect(
    (_, args: CellActions.ISourceChangeParams) => {
      // Log.debug('cell sourceChanged', args);

      const { sharedModel } = args;
      const cell = CellDictionary.global.getBySharedModel(sharedModel);
      const model = cell?.model;
      if (model) {
        CellMetadata.configOverride.setDirty(model);
        CellMetadata.code.setDirty(model);
      }
    }
  );

  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      Log.debug('cell metadataChanged', args);

      const { model, change } = args;
      const cell = CellDictionary.global.getByModel(model);
      const styleRelevantKeys = ['##Config', '##ConfigOverride'];
      if (cell && styleRelevantKeys.includes(change.key)) {
        CellStyle.update(cell);
      }
    }
  );
}

export { CellContext, CellMetadata, CellActions, CellDictionary };
export { CellConfig } from './config';
export { CellCode, CodeContext } from './code';
