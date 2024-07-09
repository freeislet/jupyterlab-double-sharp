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
      // Log.debug('afterExecution', args);

      // kernel variables 업데이트
      const inspector = CodeInspector.getByCells(args.cells);
      inspector?.updateKernelVariables();
    }
  );
}

export { CodeInspector };
export { ICodeVariables } from './inspector';
