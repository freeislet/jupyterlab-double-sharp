import { patchExecutionFunctions } from './patch';

export function setupExecution() {
  patchExecutionFunctions();
}

export { ExecutionActions } from './actions';
