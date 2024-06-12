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
      label: '## Run all cells (with cache)',
      execute: () => {
        // TODO: run all w/ cache 구현 (execution plan? context?)
        App.instance.commands.execute('notebook:run-all-cells');
      }
    },
    { keys: ['Accel Shift Enter'], selector: selectors.NOTEBOOK }
  );
}

export { ExecutionActions } from './actions';
