import * as React from 'react';

import {
  CellContext,
  CellConfig,
  CellCSMagic,
  CellCode,
  CellExecution
} from '../../cell';
import { Settings } from '../../settings';
import { useStateObject, useSignal } from '../../ui/hooks';
import Group from '../../ui/group';
import { Row, Boolean_, NullableBoolean, List } from './common';
import { Block } from './block';
import { StatusIcon, TooltipIcon } from './icon';

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
  config: CellConfig.IData;
  updateConfig: (config: Partial<CellConfig.IData>) => void;
  csMagic: CellCSMagic.IData | undefined;
  csMagicDirty: boolean;
  compositeConfig: NonNullableField<CellConfig.IData>;
  code: CellCode.IData | undefined;
  codeDirty: boolean;
  updateCode: () => void;
  execution: CellExecution.IData | undefined;
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
    CellConfig.metadata.defaultValue
  );
  const updateAndApplyConfig = React.useCallback(
    (config: Partial<CellConfig.IData>) => {
      updateConfig(config);
      CellConfig.metadata.update(model, config);
    },
    [context]
  );

  // cs-magic state
  // NOTE: csMagicDirty true인 경우 compositeConfig invalid 가능 (checkDirty=false로 get하므로)
  const [csMagic, setCsMagic] = React.useState<CellCSMagic.IData>();
  const [csMagicDirty, setCsMagicDirty] = React.useState(false);

  // settings, cell config 통합 config states
  const getCompositeConfig = () => CellConfig.get(model, false); // checkDirty=false: cs-command까지는 확인 안 함
  const [compositeConfig, setCompositeConfig] =
    React.useState<NonNullableField<CellConfig.IData>>(getCompositeConfig);

  // code states, callback
  const [code, setCode] = React.useState<CellCode.IData>();
  const [codeDirty, setCodeDirty] = React.useState(false);
  const updateCode = React.useCallback(() => {
    const update = async () => {
      await context.codeContext?.getData();
      // NOTE: state 업데이트 필요 없음 -> metadataChanged signal에서 처리
    };
    update();
  }, [context]);

  // execution status, callback
  const [execution, setExecution] = React.useState<CellExecution.IData>();

  // context 초기화
  React.useEffect(() => {
    setConfig(CellConfig.metadata.getCoalesced(model));
    setCsMagic(CellCSMagic.metadata.get(model, false));
    setCsMagicDirty(CellCSMagic.metadata.isDirty(model));
    setCompositeConfig(getCompositeConfig());
    setCode(CellCode.metadata.get(model, false));
    setCodeDirty(CellCode.metadata.isDirty(model));
    setExecution(CellExecution.metadata.get(model));
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
        case CellConfig.metadata.name: // ##Config
          // Cell Inspector > Config > updateConfig
          setCompositeConfig(getCompositeConfig());
          break;

        case CellCSMagic.metadata.name: // ##CSMagic
          // 셀 실행 > Client-side Magic Command
          setCsMagic(change.newValue as CellCSMagic.IData);
          setCompositeConfig(getCompositeConfig());
          break;

        case CellCSMagic.metadata.dirtyFlagName: // ##CSMagic-dirty
          // 셀 실행 시 dirty 해결 (false)
          // source 수정 시 dirty 설정 (true)
          setCsMagicDirty(change.newValue as boolean);
          break;

        case CellCode.metadata.name: // ##Code
          // 1. dirty 알림 "click" 클릭 > updateCode > CodeContext.getData
          // 2. 셀 실행 (compositeConfig.cache or autoDependency true 시)
          setCode(change.newValue);
          break;

        case CellCode.metadata.dirtyFlagName: // ##Code-dirty
          // ##Code 업데이트 시 dirty 해결 (false)
          // source 수정 시 dirty 설정 (true)
          setCodeDirty(change.newValue as boolean);
          break;

        case CellExecution.metadata.name: // ##Execution
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
        csMagic: csMagic,
        csMagicDirty: csMagicDirty,
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
      <Cell />
    </CodeCellContext.Provider>
  );
}

/**
 * Cell 일반 정보
 */
function Cell() {
  const { context } = React.useContext(CodeCellContext)!;

  return (
    <Group>
      <Group.Title>Cell</Group.Title>
      {context.cell.model.id}
    </Group>
  );
}

/**
 * Config
 */
function Config() {
  const { config, updateConfig, csMagic, csMagicDirty, compositeConfig } =
    React.useContext(CodeCellContext)!;

  return (
    <Group>
      <Group.Title>Config</Group.Title>
      <ConfigRow
        value={config.cache}
        csMagicValue={csMagic?.cache}
        csMagicValueDirty={csMagicDirty}
        compositeValue={compositeConfig.cache}
        csMagic="##%cache"
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
        csMagicValue={csMagic?.skip}
        csMagicValueDirty={csMagicDirty}
        compositeValue={compositeConfig.skip}
        csMagic="##%skip"
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
  compositeValue: NonNullable<T>;
  csMagicValue?: T | undefined;
  csMagicValueDirty?: boolean;
  csMagic?: string;
}

function ConfigRow<T>({
  children,
  value,
  compositeValue,
  csMagicValue,
  csMagicValueDirty,
  csMagic
}: IConfigRowProps<T>) {
  const statusType = compositeValue ? 'ok' : 'no';
  const comments: React.ReactNode[] = [];

  if (value !== compositeValue) {
    // config 설정값과 실제 적용된 값이 다르면 툴팁 아이콘으로 이유 노출
    const applyStr = compositeValue ? 'enabled' : 'disabled';

    // client-side magic command로 config overridden
    const csmagicApplied = csMagicValue === compositeValue;
    if (csmagicApplied && csMagic) {
      comments.push(`${applyStr} by '${csMagic}' command.`);
    }

    // settings에 의해 config overridden
    const settingApplied = !csmagicApplied;
    if (settingApplied) {
      comments.push(`${applyStr} by settings.`);
    }
  }
  if (csMagicValueDirty && csMagic) {
    // client-side magic command로 config 변경될 가능성 있으면 알림
    comments.push(`can be overridden by '${csMagic}' command.`);
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
    (compositeConfig.cache || compositeConfig.autoDependency) &&
    !compositeConfig.skip;

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
      <ListRow header="Variables:" data={code?.variables} />
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
      <Group.Title>Execution</Group.Title>
      {!execution ? (
        <Block type="info">Execution info does not exist.</Block>
      ) : execution.skipped ? (
        <Block type="warning" iconType="info">
          Execution skipped.
        </Block>
      ) : execution.cached ? (
        !execution.code?.variables.length ? (
          <Block type="success" iconType="info">
            Execution skipped. <strong>(no variables)</strong>
          </Block>
        ) : (
          <>
            <Block type="success">
              Execution skipped by <strong>cache</strong>.
            </Block>
            <ListRow header="Cached Vars:" data={execution?.code?.variables} />
          </>
        )
      ) : (
        <>
          <HeaderRow header="Dependency Cell Count:">
            <span>{execution?.dependencyCells?.length ?? 0}</span>
          </HeaderRow>
          <ListRow header="Variables:" data={execution?.code?.variables} />
          {execution?.code?.unboundVariables && (
            <ListRow
              header="Unbound Vars:"
              data={execution?.code?.unboundVariables}
            />
          )}
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
