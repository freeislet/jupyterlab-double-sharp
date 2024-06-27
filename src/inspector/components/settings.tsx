import * as React from 'react';

import { Settings as AppSettings } from '../../settings';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import { Boolean_ } from './common';

// export interface ISettingsProps {}

export default function Settings() {
  const [execution, setExecution, updateExecution] = useStateObject(
    AppSettings.data.execution
  );

  useSignal(
    AppSettings.executionChanged,
    (_, change) => {
      setExecution(change.newValue);
    },
    []
  );

  const update = (execution: Partial<AppSettings.IExecution>) => {
    updateExecution(execution);
    AppSettings.updateExecution(execution);
  };

  // Log.debug('Settings', execution, AppSettings.data.execution);

  return (
    <Group className="jp-DoubleSharp-space-y-8">
      <Group.Title>Execution settings</Group.Title>
      <Boolean_
        value={execution.cache}
        onChange={(value: boolean) => update({ cache: value })}
      >
        Execution Cache
      </Boolean_>
      <Boolean_
        value={execution.autoDependency}
        onChange={(value: boolean) => update({ autoDependency: value })}
      >
        Auto Dependency
      </Boolean_>
      <Boolean_
        value={execution.forceOnSingleCell}
        onChange={(value: boolean) => update({ forceOnSingleCell: value })}
      >
        Force Execution on Single Cell
      </Boolean_>
      <Boolean_
        value={execution.disableCache}
        onChange={(value: boolean) => update({ disableCache: value })}
      >
        Disable Execution Cache
      </Boolean_>
      <Boolean_
        value={execution.disableAutoDependency}
        onChange={(value: boolean) => update({ disableAutoDependency: value })}
      >
        Disable Auto Dependency
      </Boolean_>
      <Boolean_
        value={execution.disableSkip}
        onChange={(value: boolean) => update({ disableSkip: value })}
      >
        Disable Cell Execution Skip
      </Boolean_>
    </Group>
  );
}
