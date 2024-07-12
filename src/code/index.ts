import { JupyterFrontEnd } from '@jupyterlab/application';

import { CodeInspectorExtension, CodeInspector } from './inspector';
import { ExecutionActions } from '../execution';

export function setupCodeExtensions(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new CodeInspectorExtension());

  setupCodeActions();
}

function setupCodeActions() {
  ExecutionActions.afterExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // NOTE: afterExecution 시점에 아직 실행 결과를 받지 못한 상태. "실행 후"라고 할 수 없지만,
      //       kernel에서 실행결과를 순차적으로 내려주어 kernel vars 업데이트에는 문제 없는 듯 함.
      //       (추가 검토 필요)

      // Log.debug('afterExecution', args);

      // kernel variables 업데이트
      const inspector = CodeInspector.getByCells(args.cells);
      inspector?.updateKernelVariables();
    }
  );
}

export { CodeInspector };
export { ICodeData } from './inspector';
