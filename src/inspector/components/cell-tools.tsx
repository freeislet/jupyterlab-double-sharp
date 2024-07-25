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
import { CellId, Boolean_, NullableBoolean } from './common';
import { Row, HeaderRow, NameListRow, CellIdListRow } from './row';
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
    <Group data-group="Cell">
      <Group.Title>Cell</Group.Title>
      <HeaderRow header="Model ID:">
        <CellId id={context.cell.model.id} />
      </HeaderRow>
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
    <Group data-group="Config">
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
    <Row columnGap={8}>
      {children}
      <Row columnGap={2}>
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
    <Group data-group="Code">
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
      <NameListRow header="Variables:" data={code?.variables} />
      <NameListRow header="Unbound Vars:" data={code?.unboundVariables} />
    </Group>
  );
}

/**
 * Execution
 */
function Execution() {
  const { execution } = React.useContext(CodeCellContext)!;

  return (
    <Group data-group="Execution">
      <Group.Title>Execution</Group.Title>
      <ExecutionInfo data={execution} />
    </Group>
  );
}

function ExecutionInfo({ data }: { data: CellExecution.IData | undefined }) {
  if (!data) {
    return <Block type="info">Execution info does not exist.</Block>;
  } else if (data.skipped) {
    return (
      <Block type="warning" iconType="info">
        Execution skipped.
      </Block>
    );
  } else if (data.cached) {
    return !data.code?.variables.length ? (
      <Block type="success" iconType="info">
        Execution skipped. <strong>(no variables)</strong>
      </Block>
    ) : (
      <>
        <Block type="success">
          Execution skipped by <strong>cache</strong>.
        </Block>
        <NameListRow header="Cached Vars:" data={data.code?.variables} />
      </>
    );
  }

  const { config, code, dependency, dependencyCells } = data;

  function statusType(status: boolean) {
    return status ? 'ok' : 'no';
  }

  return (
    <>
      {config && (
        <Group>
          <Group.Title>Config</Group.Title>
          <HeaderRow header="Execution Cache:">
            <StatusIcon type={statusType(config.cache)} />
          </HeaderRow>
          <HeaderRow header="Auto Dependency:">
            <StatusIcon type={statusType(config.autoDependency)} />
          </HeaderRow>
        </Group>
      )}
      {code && (
        <Group>
          <Group.Title>Code</Group.Title>
          <NameListRow header="Variables:" data={code.variables} />
          <NameListRow header="Unbound Vars:" data={code.unboundVariables} />
        </Group>
      )}
      {dependency?.unresolvedVariables && (
        <NameListRow
          header="Unresolved Vars:"
          data={dependency.unresolvedVariables}
        />
      )}
      <CellIdListRow
        header="Dependency:"
        data={dependencyCells?.map(cell => cell.modelId)}
      />
    </>
  );
}
