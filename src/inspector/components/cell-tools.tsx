import * as React from 'react';
import { ICellModel } from '@jupyterlab/cells';
import { IMapChange } from '@jupyter/ydoc';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';
import { Block } from './common';

export interface ICellToolsProps {
  context: CellContext | null;
}

export default function CellTools({ context }: ICellToolsProps) {
  return context ? (
    context.isCodeCell ? (
      <CodeCellTools context={context} />
    ) : (
      <p>No code cell is selected.</p>
    )
  ) : (
    <p>No code cell is selected.</p>
  );
}

// CodeCellContext

interface ICodeCellContext {
  context: CellContext;
  config: CellConfig.IConfig;
  updateConfig: (config: Partial<CellConfig.IConfig>) => void;
}

const CodeCellContext = React.createContext<ICodeCellContext | undefined>(
  undefined
);

/**
 * IContextProps
 */
interface IContextProps {
  context: CellContext;
}

/**
 * CodeCellTools
 */
function CodeCellTools({ context }: IContextProps) {
  const model = context.cell.model;

  const [config, setConfig, updateConfig] = useStateObject(
    CellMetadata.config.defaultValue
  );
  const updateAndApplyConfig = React.useCallback(
    (config: Partial<CellConfig.IConfig>) => {
      updateConfig(config);
      CellMetadata.config.update(model, config);
      Log.debug('Config apply', context, model.id, config);
    },
    [context]
  );

  React.useEffect(() => {
    const config = CellMetadata.config.getCoalesced(model);
    setConfig(config);
    Log.debug('Config', model.id, config);
  }, [context]);

  return (
    <CodeCellContext.Provider
      value={{ context, config, updateConfig: updateAndApplyConfig }}
    >
      <Config />
      <Code context={context} />
      {context.cell.model.id}
    </CodeCellContext.Provider>
  );
}

/**
 * Config
 */
function Config() {
  const { context, config, updateConfig } = React.useContext(CodeCellContext)!;

  const model = context.cell.model;

  useSignal(
    model.metadataChanged,
    (model: ICellModel, change: IMapChange) => {
      if (change.key === CellMetadata.configOverride.dirtyFlagName) {
        // TODO
      }
    },
    [context]
  );

  const onCache = React.useCallback(
    (value: boolean | null) => updateConfig({ cache: value }),
    [context]
  );
  const onAutoDependency = React.useCallback(
    (value: boolean | null) => updateConfig({ autoDependency: value }),
    [context]
  );
  const onSkip = React.useCallback(
    (value: boolean) => updateConfig({ skip: value }),
    [context]
  );

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
  const [executionMatters, setExecutionMatters] = React.useState(false);

  const model = context.cell.model;

  React.useEffect(() => {
    const metadata = CellMetadata.code.get(model, false);
    const dirty = CellMetadata.code.isDirty(model);
    setMetadata(metadata);
    setDirty(dirty);

    // 실행을 통해 dirty 상태 해결되는지 여부에 따라 "execute the cell" 문구 표시
    const config = CellConfig.get(model, false); // checkDirty=false: cs-command까지는 확인 안 함
    Log.debug('Code executionMatters', model, config);
    setExecutionMatters(config.cache || config.autoDependency);
  }, [context]);

  useSignal(
    model.metadataChanged,
    (model: ICellModel, change: IMapChange) => {
      // metadataChanged signal을 통해 metadata, dirty state 갱신
      //   1. dirty 해결 (false)
      //     A. 셀 실행
      //     B. dirty 알림 click 클릭 > update > CodeContext.getData
      //   2. dirty 설정 (true)
      //     A. source 수정

      switch (change.key) {
        case CellMetadata.code.name: // ##Code
          setMetadata(change.newValue);
          break;

        case CellMetadata.code.dirtyFlagName: // ##Code-dirty
          setDirty(change.newValue as boolean);
          break;
      }

      // Log.debug('Code metadataChanged', model, change);
    },
    [context]
  );

  const updateMetadata = async () => {
    await context.codeContext?.getData();
  };

  return (
    <Group>
      <Group.Title>Code</Group.Title>
      {dirty && (
        <Block type="warning" className="jp-DoubleSharp-Inspector-row">
          Code info may be invalid.
          <br />
          {executionMatters && (
            <>
              <strong>execute</strong> the cell or{' '}
            </>
          )}
          <a onClick={updateMetadata}>click</a> to update.
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
