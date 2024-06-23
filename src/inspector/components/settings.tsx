import * as React from 'react';

import { Settings as AppSettings } from '../../settings';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import Checkbox from '../../ui/checkbox';

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

  const updateAndApply = (execution: Partial<AppSettings.IExecution>) => {
    updateExecution(execution);
    AppSettings.updateExecution(execution);
  };
  const onCache = React.useCallback(
    (checked: boolean) => updateAndApply({ cache: checked }),
    []
  );
  const onAutoDependency = React.useCallback(
    (checked: boolean) => updateAndApply({ autoDependency: checked }),
    []
  );
  const onForceOnSingleCell = React.useCallback(
    (checked: boolean) => updateAndApply({ forceOnSingleCell: checked }),
    []
  );

  // Log.debug('Settings', execution, AppSettings.data.execution);

  return (
    <Group>
      <Group.Title>Execution settings</Group.Title>
      <BooleanSetting checked={execution.cache} onChange={onCache}>
        Execution Cache by default
      </BooleanSetting>
      <BooleanSetting
        checked={execution.autoDependency}
        onChange={onAutoDependency}
      >
        Auto Dependency by default
      </BooleanSetting>
      <BooleanSetting
        checked={execution.forceOnSingleCell}
        onChange={onForceOnSingleCell}
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
        className="jp-DoubleSharp-Inspector-row"
        checked={checked}
        onChangeValue={onChange}
      >
        <span>{children}</span>
      </Checkbox>
    );
  }
);
BooleanSetting.displayName = 'BooleanSetting';
