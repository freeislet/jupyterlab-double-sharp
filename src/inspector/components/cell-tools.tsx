import * as React from 'react';
// import { ICellModel } from '@jupyterlab/cells';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';
import { Block } from './common';

export interface ICellToolsProps {
  context: CellContext | null;
}

export default function CellTools({ context }: ICellToolsProps) {
  if (context) {
    return (
      <>
        <Config context={context} />
        {context.isCodeCell && <Code context={context} />}
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
    // Log.debug('Config', model.id, config);
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

/**
 * Code
 */

function Code({ context }: IContextProps) {
  const [metadata, setMetadata] = React.useState<
    CellMetadata.ICode | undefined
  >(CellMetadata.code.defaultValue);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    const model = context.cell.model;
    const metadata = CellMetadata.code.getRaw(model);
    const dirty = CellMetadata.code.isDirty(model);
    setMetadata(metadata);
    setDirty(dirty);
  }, [context]);

  const codeContext = context.codeContext;
  const update = async () => {
    const metadata = await codeContext?.getData();
    setMetadata(metadata);
    setDirty(false);
  };

  // TODO: executed signal
  // TODO: dirty signal (metadata changed)

  return (
    <Group>
      <Group.Title>Code</Group.Title>
      {dirty && (
        <Block type="warning" className="jp-DoubleSharp-Inspector-row">
          Code information is dirty.
          <br />
          <strong>execute</strong> the cell or{' '}
          <a onClick={update}>
            <strong>click</strong>
          </a>
          .
        </Block>
      )}
      <div className="jp-DoubleSharp-Inspector-row jp-DoubleSharp-Inspector-space">
        <strong>Variables: </strong>
        <span>{metadata?.variables.join(', ')}</span>
      </div>
      <div className="jp-DoubleSharp-Inspector-row jp-DoubleSharp-Inspector-space">
        <strong>Unbound Vars: </strong>
        <span>{metadata?.unboundVariables.join(', ')}</span>
      </div>
    </Group>
  );
}
