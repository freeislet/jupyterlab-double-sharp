import { Cell, CodeCell } from '@jupyterlab/cells';
import { StreamType, MultilineString } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';

import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { CellExecution, ExecutionPlan } from './execution';
import { CodeInspector, ICodeVariables } from '../code';
import { metadataKeys } from '../const';
import { MetadataGroupDirtyable } from '../utils/metadata';
import { isCodeCell } from '../utils/cell';
import { Cache } from '../utils/cache';
import { CellError } from '../utils/error';
import { stringFrom } from '../utils/object';

export function setupCellCode() {
  CellActions.sourceChanged.connect(
    (_, args: CellActions.ISourceChangeParams) => {
      // Log.debug('cell sourceChanged', args);

      const { sharedModel } = args;
      const cell = CellDictionary.global.getBySharedModel(sharedModel);
      const model = cell?.model;
      if (model) {
        CellCode.metadata.setDirty(model);
      }
    }
  );
}

export namespace CellCode {
  export interface IData extends ICodeVariables {}

  export type IExecutionVariables = ICodeVariables & {
    /**
     * unboundVariables에서 kernel variables 제외한 변수들
     */
    unresolvedVariables: string[];
  };
}

export class CellCode {
  private static _metadata = new MetadataGroupDirtyable<CellCode.IData>(
    metadataKeys.code,
    {
      variables: [],
      unboundVariables: []
    }
  );

  static get metadata(): MetadataGroupDirtyable<CellCode.IData> {
    return CellCode._metadata;
  }
}

export class CodeContext {
  static fromCell(
    cell: Cell,
    inspector?: CodeInspector
  ): CodeContext | undefined {
    if (isCodeCell(cell)) {
      return new CodeContext(cell, inspector);
    }
  }

  //----

  private _inspectorCache: Cache<CodeInspector>;
  // private _output = new CodeOutput(this);

  get inspector(): CodeInspector {
    return this._inspectorCache.value;
  }

  //----

  constructor(
    public readonly cell: CodeCell,
    inspector?: CodeInspector
  ) {
    this._inspectorCache = new Cache<CodeInspector>(() => {
      const inspector = CodeInspector.getByCell(this.cell);
      if (!inspector) {
        throw new CellError(this.cell, 'cannot find CodeInspector');
      }
      return inspector;
    }, inspector);
  }

  /**
   * ##Code metadata에 variables 정보 저장 및 리턴 (또는, 기존 metadata 조회))
   */
  async getData(): Promise<CellCode.IData> {
    const cachedMetadata = CellCode.metadata.get(this.cell.model);
    if (cachedMetadata) return cachedMetadata;

    const codeVars = await this.inspector.getCodeVariables(this.cell);
    const metadata = CellCode.metadata.getCoalescedValue(codeVars);
    CellCode.metadata.set(this.cell.model, metadata);
    return metadata;
  }

  /**
   * ICode metadata + IExecutionVariables(unresolved variables) 조회
   */
  async getExecutionVariables(): Promise<CellCode.IExecutionVariables> {
    const data = await this.getData();
    const unresolvedVariables = this.inspector.filterNonKernelVariables(
      data.unboundVariables
    );
    const execVars = { ...data, unresolvedVariables };
    // console.debug('execution variables', execVars);
    return execVars;
  }

  /**
   * Cell variables cached 여부 리턴
   */
  async isCached(): Promise<boolean> {
    const data = await this.getData();
    const uncachedVars = this.inspector.filterNonKernelVariables(
      data.variables
    );
    return !uncachedVars.length;
  }

  /**
   * 셀 실행 계획 수집 (dependent cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependent cells 수집
   */
  async buildExecutionPlan(): Promise<CellExecution.IPlan> {
    Log.debug(`cell execution plan { (${this.cell.model.id})`);

    const plan = new ExecutionPlan(this);
    const planData = await plan.build();
    plan.saveMetadata();

    Log.debug(`} cell execution plan (${this.cell.model.id})`, plan);
    return planData;
  }
}

export namespace CodeOutput {
  export interface IOptions {
    streamType: StreamType;
    overwrite: boolean;
  }
}

export class CodeOutput {
  constructor(public readonly context: CodeContext) {}

  get outputs(): IOutputAreaModel {
    return this.context.cell.outputArea.model;
  }

  getLastIndex(): number | undefined {
    for (let i = this.outputs.length - 1; i >= 0; --i) {
      const output = this.outputs.get(i);
      if (output.type === 'stream' && output.toJSON()['_##']) {
        return i;
      }
    }
  }

  print(msg: MultilineString, options?: Partial<CodeOutput.IOptions>) {
    const streamType = options?.streamType ?? 'stdout';
    const overwrite = options?.overwrite ?? true;

    const output = {
      output_type: 'stream',
      name: streamType,
      text: msg,
      '_##': true
    };

    const overwriteIndex = overwrite ? this.getLastIndex() : undefined;
    if (overwriteIndex !== undefined) {
      this.outputs.set(overwriteIndex, output);
    } else {
      this.outputs.add(output);
    }
    // Log.debug('outputs', this.outputs.toJSON(), overwriteIndex);
  }

  printSkipped() {
    this.clearError();
    this.print('## skipped\n', { streamType: 'stderr' });
  }

  printCached(data: CellCode.IData) {
    this.clearError();
    this.print(`## cached: ${stringFrom(data.variables)}\n`, {
      streamType: 'stderr'
    });
  }

  clearError() {
    let numCleared = 0;

    for (let i = 0; i < this.outputs.length; ++i) {
      const output = this.outputs.get(i);
      if (
        output.type === 'error' ||
        (output.type === 'stream' && output.toJSON().name === 'stderr')
      ) {
        this.outputs.set(i, { output_type: 'null' });
        ++numCleared;
      }
    }

    if (numCleared === this.outputs.length) {
      this.outputs.clear();
    }
  }
}
