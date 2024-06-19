import * as React from 'react';

import { Settings as AppSettings } from '../../settings';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import Checkbox from '../../ui/checkbox';

// export interface ISettingsProps {}

export default function Settings() {
  const [execution, updateExecution, setExecution] = useStateObject(
    AppSettings.data.execution,
    AppSettings.updateExecution
  );
  useSignal(AppSettings.executionChanged, (_, change) => {
    setExecution(change.newValue);
  });

  const onUseCache = React.useCallback(
    (checked: boolean) => updateExecution({ useCache: checked }),
    []
  );
  const onAutoDependency = React.useCallback(
    (checked: boolean) => updateExecution({ autoDependency: checked }),
    []
  );
  const onForceSingleExec = React.useCallback(
    (checked: boolean) =>
      updateExecution({ forceExecutionOnSingleCell: checked }),
    []
  );

  // Log.debug('Settings', execution, AppSettings.data.execution);

  return (
    <Group>
      <Group.Title>Execution settings</Group.Title>
      <BooleanSetting checked={execution.useCache} onChange={onUseCache}>
        Use Cache by default
      </BooleanSetting>
      <BooleanSetting
        checked={execution.autoDependency}
        onChange={onAutoDependency}
      >
        Auto Dependency by default
      </BooleanSetting>
      <BooleanSetting
        checked={execution.forceExecutionOnSingleCell}
        onChange={onForceSingleExec}
      >
        Force Execution on Single Cell
      </BooleanSetting>
    </Group>
  );
}

interface IBooleanSettingProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

const BooleanSetting = React.memo(
  ({ checked, onChange, children }: IBooleanSettingProps) => {
    return (
      <Checkbox
        className="jp-DoubleSharp-Settings-row"
        checked={checked}
        onChangeValue={onChange}
      >
        <span>{children}</span>
      </Checkbox>
    );
  }
);
BooleanSetting.displayName = 'BooleanSetting';
