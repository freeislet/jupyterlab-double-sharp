import * as React from 'react';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { Settings } from '../../settings';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import {
  Row,
  Boolean_,
  NullableBoolean,
  StatusIcon,
  TooltipIcon,
  Block,
  List
} from './common';

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
  config: CellMetadata.IConfig;
  updateConfig: (config: Partial<CellMetadata.IConfig>) => void;
  overriddenConfig: CellMetadata.IConfigOverride | undefined;
  overriddenConfigDirty: boolean;
  compositeConfig: NonNullableField<CellConfig.IConfig>;
  code: CellMetadata.ICode | undefined;
  codeDirty: boolean;
  updateCode: () => void;
  execution: CellMetadata.IExecution | undefined;
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
    (config: Partial<CellMetadata.IConfig>) => {
      updateConfig(config);
      CellMetadata.config.update(model, config);
    },
    [context]
  );

  // overridden config state (client-side magic command에 의한 config)
  // NOTE: overriddenConfigDirty true인 경우 compositeConfig invalid 가능 (checkDirty=false로 get하므로)
  const [overriddenConfig, setOverriddenConfig] =
    React.useState<CellMetadata.IConfigOverride>(); // cs-command
  const [overriddenConfigDirty, setOverriddenConfigDirty] =
    React.useState(false); // cs-command dirty

  // settings, cell config 통합 config states
  const getCompositeConfig = () => CellConfig.get(model, false); // checkDirty=false: cs-command까지는 확인 안 함
  const [compositeConfig, setCompositeConfig] =
    React.useState<NonNullableField<CellConfig.IConfig>>(getCompositeConfig);

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

  // execution status, callback
  const [execution, setExecution] = React.useState<CellMetadata.IExecution>();

  // context 초기화
  React.useEffect(() => {
    setConfig(CellMetadata.config.getCoalesced(model));
    setOverriddenConfig(CellMetadata.configOverride.get(model, false));
    setOverriddenConfigDirty(CellMetadata.configOverride.isDirty(model));
    setCompositeConfig(getCompositeConfig());
    setCode(CellMetadata.code.get(model, false));
    setCodeDirty(CellMetadata.code.isDirty(model));
    setExecution(CellMetadata.execution.get(model));
  }, [context]);

  // Settings 변경 시 state 업데이트
  useSignal(
    Settings.executionChanged,
    (_, change) => {
      setCompositeConfig(getCompositeConfig());
    },
    [context]
  );
  useSignal(
    Settings.csMagicChanged,
    (_, change) => {
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
          setCompositeConfig(getCompositeConfig());
          break;

        case CellMetadata.configOverride.name: // ##ConfigOverride
          // 셀 실행 > Client-side Magic Command
          setOverriddenConfig(change.newValue as CellMetadata.IConfigOverride);
          setCompositeConfig(getCompositeConfig());
          break;

        case CellMetadata.configOverride.dirtyFlagName: // ##ConfigOverride-dirty
          // 셀 실행 시 dirty 해결 (false)
          // source 수정 시 dirty 설정 (true)
          setOverriddenConfigDirty(change.newValue as boolean);
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

        case CellMetadata.execution.name: // ##Execution
          // 셀 실행
          setExecution(change.newValue);
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
        overriddenConfig,
        overriddenConfigDirty,
        compositeConfig,
        code,
        codeDirty,
        updateCode,
        execution
      }}
    >
      <Config />
      <Code />
      <Execution />
      {context.cell.model.id}
    </CodeCellContext.Provider>
  );
}

/**
 * Config
 */
function Config() {
  const {
    config,
    updateConfig,
    overriddenConfig,
    overriddenConfigDirty,
    compositeConfig
  } = React.useContext(CodeCellContext)!;

  return (
    <Group>
      <Group.Title>Config</Group.Title>
      <ConfigRow
        value={config.cache}
        overriddenValue={overriddenConfig?.cache}
        overriddenValueDirty={overriddenConfigDirty}
        compositeValue={compositeConfig.cache}
        magic="##%cache"
      >
        <NullableBoolean
          value={config.cache}
          onChange={(value: boolean | null) => updateConfig({ cache: value })}
        >
          Execution Cache
        </NullableBoolean>
      </ConfigRow>
      <ConfigRow
        value={config.autoDependency}
        overriddenValue={overriddenConfig?.autoDependency}
        overriddenValueDirty={overriddenConfigDirty}
        compositeValue={compositeConfig.autoDependency}
      >
        <NullableBoolean
          value={config.autoDependency}
          onChange={(value: boolean | null) =>
            updateConfig({ autoDependency: value })
          }
        >
          Auto Dependency
        </NullableBoolean>
      </ConfigRow>
      <ConfigRow
        value={config.skip}
        overriddenValue={overriddenConfig?.skip}
        overriddenValueDirty={overriddenConfigDirty}
        compositeValue={compositeConfig.skip}
        magic="##%skip"
      >
        <Boolean_
          value={config.skip}
          onChange={(value: boolean) => updateConfig({ skip: value })}
        >
          Skip
        </Boolean_>
      </ConfigRow>
    </Group>
  );
}

interface IConfigRowProps<T> {
  children: React.ReactNode;
  value: T;
  overriddenValue: T | undefined;
  overriddenValueDirty: boolean;
  compositeValue: NonNullable<T>;
  magic?: string;
}

function ConfigRow<T>({
  children,
  value,
  overriddenValue,
  overriddenValueDirty,
  compositeValue,
  magic
}: IConfigRowProps<T>) {
  const statusType = compositeValue ? 'ok' : 'no';
  const comments: React.ReactNode[] = [];

  if (value !== compositeValue) {
    // config 설정값과 실제 적용된 값이 다르면 툴팁 아이콘으로 이유 노출
    const applyStr = compositeValue ? 'enabled' : 'disabled';

    // client-side magic command로 config overridden
    const overriddenApplied = overriddenValue === compositeValue;
    if (overriddenApplied && magic) {
      comments.push(`${applyStr} by '${magic}' command.`);
    }

    // settings에 의해 config overridden
    const settingApplied = !overriddenApplied;
    if (settingApplied) {
      comments.push(`${applyStr} by settings.`);
    }
  }
  if (overriddenValueDirty && magic) {
    // client-side magic command로 config 변경될 가능성 있으면 알림
    comments.push(`can be overridden by '${magic}' command.`);
  }

  return (
    <Row spaceX={8}>
      {children}
      <Row spaceX={2}>
        <StatusIcon type={statusType} />
        {comments.length > 0 && (
          <TooltipIcon>
            {comments.map((comment, idx) => (
              <React.Fragment key={idx}>
                {comment}
                <br />
              </React.Fragment>
            ))}
          </TooltipIcon>
        )}
      </Row>
    </Row>
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
    <Group className="jp-DoubleSharp-space-y-8">
      <Group.Title>Code</Group.Title>
      {codeDirty && (
        <Block type="warning">
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
      <ListRow header="Out Variables:" data={code?.variables} />
      <ListRow header="Unbound Vars:" data={code?.unboundVariables} />
    </Group>
  );
}

/**
 * Execution
 */
function Execution() {
  const { execution } = React.useContext(CodeCellContext)!;

  return (
    <Group className="jp-DoubleSharp-space-y-8">
      <Group.Title>Execution Result</Group.Title>
      {!execution ? (
        <Block type="info">Execution info does not exist.</Block>
      ) : execution.skipped ? (
        <Block type="warning" iconType="info">
          Execution skipped.
        </Block>
      ) : execution.cached ? (
        <>
          <Block type="success">
            Execution skipped by <strong>cache</strong>.
          </Block>
          <ListRow header="Cached Vars:" data={execution?.outVariables} />
        </>
      ) : (
        <>
          <HeaderRow header="Executed Cell Count:">
            <span>{execution?.cells?.length}</span>
          </HeaderRow>
          {/* <ListRow header="Out Variables:" data={execution?.outVariables} /> */}
          {/* {execution?.dependency?.unresolvedCellVariables && (
            <ListRow
              header="Unresolved Cell Vars:"
              data={execution?.dependency?.unresolvedCellVariables}
            />
          )} */}
          {execution?.dependency?.unresolvedVariables && (
            <ListRow
              header="Unresolved Vars:"
              data={execution?.dependency?.unresolvedVariables}
            />
          )}
        </>
      )}
    </Group>
  );
}

interface IHeaderRowProps {
  header: string;
  children?: React.ReactNode;
}

function HeaderRow({ header, children }: IHeaderRowProps) {
  return (
    <Row spaceX={4} wrap={true}>
      <strong>{header}</strong>
      {children}
    </Row>
  );
}

interface IListRowProps<T> extends IHeaderRowProps {
  data: T[] | undefined;
}

function ListRow<T extends React.ReactNode>({
  data,
  ...props
}: IListRowProps<T>) {
  return (
    <HeaderRow {...props}>
      <List data={data} />
    </HeaderRow>
  );
}
