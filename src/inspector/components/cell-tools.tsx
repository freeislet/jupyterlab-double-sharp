import * as React from 'react';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { Settings } from '../../settings';
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
  compositeConfig: NonNullableField<CellConfig.IConfig>;
  compositeConfigDirty: boolean;
  code: CellMetadata.ICode | undefined;
  codeDirty: boolean;
  updateCode: () => void;
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

  // config state, callback
  const [config, setConfig, updateConfig] = useStateObject(
    CellMetadata.config.defaultValue
  );
  const updateAndApplyConfig = React.useCallback(
    (config: Partial<CellConfig.IConfig>) => {
      updateConfig(config);
      CellMetadata.config.update(model, config);
    },
    [context]
  );

  // settings, cell config 통합 config states
  const getCompositeConfig = () => CellConfig.get(model, false); // checkDirty=false: cs-command까지는 확인 안 함
  const [compositeConfig, setCompositeConfig] =
    React.useState<NonNullableField<CellMetadata.IConfig>>(getCompositeConfig);
  const [compositeConfigDirty, setCompositeConfigDirty] = React.useState(false); // cs-command dirty

  // code states, callback
  const [code, setCode] = React.useState<CellMetadata.ICode>();
  const [codeDirty, setCodeDirty] = React.useState(false);
  const updateCode = React.useCallback(() => {
    const update = async () => {
      await context.codeContext?.getData();
      // NOTE: state 업데이트 필요 없음 -> metadataChanged signal에서 처리
    };
    update();
  }, [context]);

  // context 초기화
  React.useEffect(() => {
    setConfig(CellMetadata.config.getCoalesced(model));
    setCompositeConfig(getCompositeConfig());
    setCompositeConfigDirty(CellMetadata.configOverride.isDirty(model));
    setCode(CellMetadata.code.get(model, false));
    setCodeDirty(CellMetadata.code.isDirty(model));
  }, [context]);

  // Settings.executionChanged 시 state 업데이트
  useSignal(
    Settings.executionChanged,
    (_, change) => {
      // Execution 세팅 변경
      setCompositeConfig(getCompositeConfig());
    },
    [context]
  );

  // metadataChanged 시 state 업데이트
  useSignal(
    model.metadataChanged,
    (model, change) => {
      switch (change.key) {
        case CellMetadata.config.name: // ##Config
        // Cell Inspector > Config > updateConfig
        case CellMetadata.configOverride.name: // ##ConfigOverride
          // 셀 실행 > Client-side Magic Command
          setCompositeConfig(getCompositeConfig());
          break;

        case CellMetadata.configOverride.dirtyFlagName: // ##ConfigOverride-dirty
          // 셀 실행 시 dirty 해결 (false)
          // source 수정 시 dirty 설정 (true)
          setCompositeConfigDirty(change.newValue as boolean);
          break;

        case CellMetadata.code.name: // ##Code
          // 1. dirty 알림 "click" 클릭 > updateCode > CodeContext.getData
          // 2. 셀 실행 (compositeConfig.cache or autoDependency true 시)
          setCode(change.newValue);
          break;

        case CellMetadata.code.dirtyFlagName: // ##Code-dirty
          // ##Code 업데이트 시 dirty 해결 (false)
          // source 수정 시 dirty 설정 (true)
          setCodeDirty(change.newValue as boolean);
          break;
      }

      // Log.debug('Code metadataChanged', model, change);
    },
    [context]
  );

  return (
    <CodeCellContext.Provider
      value={{
        context,
        config,
        updateConfig: updateAndApplyConfig,
        compositeConfig,
        compositeConfigDirty,
        code,
        codeDirty,
        updateCode
      }}
    >
      <Config />
      <Code />
      {context.cell.model.id}
    </CodeCellContext.Provider>
  );
}

/**
 * Config
 */
function Config() {
  const { config, updateConfig } = React.useContext(CodeCellContext)!;

  return (
    <Group>
      <Group.Title>Config</Group.Title>
      <NullableBooleanConfig
        value={config.cache}
        onChange={(value: boolean | null) => updateConfig({ cache: value })}
      >
        Execution Cache
      </NullableBooleanConfig>
      <NullableBooleanConfig
        value={config.autoDependency}
        onChange={(value: boolean | null) =>
          updateConfig({ autoDependency: value })
        }
      >
        Auto Dependency
      </NullableBooleanConfig>
      <BooleanConfig
        value={config.skip}
        onChange={(value: boolean) => updateConfig({ skip: value })}
      >
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

function BooleanConfig({ value, onChange, children }: IBooleanConfigProps) {
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

interface INullableBooleanConfigProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  children?: React.ReactNode;
}

function NullableBooleanConfig({
  value,
  onChange,
  children
}: INullableBooleanConfigProps) {
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

/**
 * Code
 */
function Code() {
  const { code, codeDirty, updateCode, compositeConfig } =
    React.useContext(CodeCellContext)!;

  // 실행을 통해 dirty 상태 해결되는지 여부에 따라 "execute the cell" 문구 표시
  const executionMatters =
    compositeConfig.cache || compositeConfig.autoDependency;

  return (
    <Group>
      <Group.Title>Code</Group.Title>
      {codeDirty && (
        <Block type="warning" className="jp-DoubleSharp-Inspector-row">
          Code info may be invalid.
          <br />
          {executionMatters && (
            <>
              <strong>execute</strong> the cell or{' '}
            </>
          )}
          <a onClick={updateCode}>click</a> to update.
        </Block>
      )}
      <div className="jp-DoubleSharp-Inspector-row jp-DoubleSharp-Inspector-space">
        <strong>Variables: </strong>
        <span>{code?.variables.join(', ')}</span>
      </div>
      <div className="jp-DoubleSharp-Inspector-row jp-DoubleSharp-Inspector-space">
        <strong>Unbound Vars: </strong>
        <span>{code?.unboundVariables.join(', ')}</span>
      </div>
    </Group>
  );
}
