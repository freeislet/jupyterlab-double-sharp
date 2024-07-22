import { fastForwardIcon } from '@jupyterlab/ui-components';

import { patchExecutionFunctions } from './patch';
import { App } from '../app';
import { commandIds, selectors } from '../const';

export function setupExecution() {
  patchExecutionFunctions();

  // Run All Cells command
  App.instance.addCommand(
    commandIds.RUN_ALL_CELLS,
    {
      icon: fastForwardIcon,
      label: '## Run all cells',
      execute: () => {
        App.instance.commands.execute('notebook:run-all-cells');
      }
    },
    { keys: ['Accel Shift Enter'], selector: selectors.NOTEBOOK }
  );
}

export { ExecutionActions } from './actions';
export {
  ICodeExecution,
  IDependency,
  IDependencyItem,
  ICodeConfig,
  ICodeContext
} from './code';
