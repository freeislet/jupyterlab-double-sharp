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
  const [csMagic, setCSMagic] = React.useState(AppSettings.data.enableCSMagic);

  useSignal(
    AppSettings.executionChanged,
    (_, change) => {
      setExecution(change.newValue);
    },
    []
  );
  useSignal(
    AppSettings.csMagicChanged,
    (_, change) => {
      setCSMagic(change.newValue);
    },
    []
  );

  const apply = (execution: Partial<AppSettings.IExecution>) => {
    updateExecution(execution);
    AppSettings.updateExecution(execution);
  };
  const applyCSMagic = (enable: boolean) => {
    setCSMagic(enable);
    AppSettings.setCSMagic(enable);
  };

  // Log.debug('Settings', execution, AppSettings.data.execution);

  return (
    <>
      <Group>
        <Group.Title>Execution settings</Group.Title>
        <Boolean_
          value={execution.cache}
          onChange={(value: boolean) => apply({ cache: value })}
        >
          Execution Cache
        </Boolean_>
        <Boolean_
          value={execution.autoDependency}
          onChange={(value: boolean) => apply({ autoDependency: value })}
        >
          Auto Dependency
        </Boolean_>
        <Boolean_
          value={execution.ignoreCacheSelected}
          onChange={(value: boolean) => apply({ ignoreCacheSelected: value })}
        >
          Ignore Cache for Selected Cells
        </Boolean_>
        <Boolean_
          value={execution.disableCache}
          onChange={(value: boolean) => apply({ disableCache: value })}
        >
          Disable Execution Cache
        </Boolean_>
        <Boolean_
          value={execution.disableAutoDependency}
          onChange={(value: boolean) => apply({ disableAutoDependency: value })}
        >
          Disable Auto Dependency
        </Boolean_>
        <Boolean_
          value={execution.disableSkip}
          onChange={(value: boolean) => apply({ disableSkip: value })}
        >
          Disable Cell Execution Skip
        </Boolean_>
      </Group>
      <Boolean_
        value={csMagic}
        onChange={(value: boolean) => applyCSMagic(value)}
      >
        Enable Client-side Magic Command
      </Boolean_>
    </>
  );
}
