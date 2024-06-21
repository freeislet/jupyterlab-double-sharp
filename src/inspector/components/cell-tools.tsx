import * as React from 'react';
// import { ICellModel } from '@jupyterlab/cells';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';

export interface ICellToolsProps {
  context: CellContext | null;
}

export default function CellTools({ context }: ICellToolsProps) {
  if (context) {
    return (
      <>
        <Config context={context} />
        {context.cell.model.id}
      </>
    );
  } else {
    return <p>No cell is selected.</p>;
  }
}

interface IContextProps {
  context: CellContext;
}

/**
 * Config
 */

function Config({ context }: IContextProps) {
  const [config, setConfig, updateConfig, setOnUpdateConfig] = useStateObject(
    CellMetadata.config.defaultValue
  );

  React.useEffect(() => {
    const model = context.cell.model;
    const config = CellMetadata.config.getCoalesced(model);
    setConfig(config);
    setOnUpdateConfig((value, merged) => {
      CellMetadata.config.update(model, value);
    });
    Log.debug('Config', model.id, config);
  }, [context]);
  useSignal;

  const onCache = React.useCallback(
    (value: boolean | null) => updateConfig({ cache: value }),
    []
  );
  const onAutoDependency = React.useCallback(
    (value: boolean | null) => updateConfig({ autoDependency: value }),
    []
  );
  const onSkip = React.useCallback(
    (value: boolean) => updateConfig({ skip: value }),
    []
  );
  // const finalConfig = CellConfig.get(context.cell.model);
  // finalConfig;
  CellConfig;

  return (
    <Group>
      <Group.Title>Config</Group.Title>
      <NullableBooleanConfig value={config.cache} onChange={onCache}>
        Execution Cache
      </NullableBooleanConfig>
      <NullableBooleanConfig
        value={config.autoDependency}
        onChange={onAutoDependency}
      >
        Auto Dependency
      </NullableBooleanConfig>
      <BooleanConfig value={config.skip} onChange={onSkip}>
        Skip
      </BooleanConfig>
    </Group>
  );
}

// Config Items

interface IBooleanConfigProps {
  value: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}

const BooleanConfig = React.memo(
  ({ value, onChange, children }: IBooleanConfigProps) => {
    return (
      <Checkbox
        className="jp-DoubleSharp-Inspector-row"
        checked={value}
        onChangeValue={onChange}
      >
        <span>{children}</span>
      </Checkbox>
    );
  }
);
BooleanConfig.displayName = 'BooleanConfig';

interface INullableBooleanConfigProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  children?: React.ReactNode;
}

const NullableBooleanConfig = React.memo(
  ({ value, onChange, children }: INullableBooleanConfigProps) => {
    return (
      <NullableCheckbox
        className="jp-DoubleSharp-Inspector-row"
        checked={value}
        onChangeValue={onChange}
      >
        <span>{children}</span>
      </NullableCheckbox>
    );
  }
);
NullableBooleanConfig.displayName = 'NullableBooleanConfig';
