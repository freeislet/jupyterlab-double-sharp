import { fastForwardIcon } from '@jupyterlab/ui-components';

import { patchExecutionFunctions } from './patch';
import { CommandRegistration } from '../command';
import { commandIds, selectors } from '../const';

export function setupExecution() {
  patchExecutionFunctions();

  // Run All Cells command
  CommandRegistration.add(
    commandIds.RUN_ALL_CELLS,
    {
      icon: fastForwardIcon,
      label: '## Run all cells (with cache)',
      execute: () => {
        // TODO: run all w/ cache 구현 (execution plan? context?)
        CommandRegistration.current?.registry.execute('notebook:run-all-cells');
      }
    },
    { keys: ['Accel Shift Enter'], selector: selectors.NOTEBOOK }
  );
}

export { ExecutionActions } from './actions';
