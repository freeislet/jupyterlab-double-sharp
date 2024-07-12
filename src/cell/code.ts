import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { CellConfig } from './config';
import { CellExecution } from './execution';
import {
  ExecutionPlanner,
  IExecutionPlan,
  ICodeContext,
  ICodeConfig
} from '../execution';
import { CodeInspector, ICodeData } from '../code';
import { metadataKeys } from '../const';
import { MetadataGroupDirtyable } from '../utils/metadata';
import { isCodeCell } from '../utils/cell';
import { Cache } from '../utils/cache';
import { CellError } from '../utils/error';

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
  export type IData = ICodeData;
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

export namespace CellCode {
  export function getInspector(cell: CodeCell): CodeInspector {
    const inspector = CodeInspector.getByCell(cell);
    if (!inspector) {
      throw new CellError(cell, 'cannot find CodeInspector');
    }
    return inspector;
  }

  /**
   * ##Code metadata에 variables 정보 저장 및 리턴 (또는, 기존 metadata 조회))
   */
  export async function getData(
    cell: CodeCell,
    inspector?: CodeInspector
  ): Promise<CellCode.IData> {
    const cachedData = CellCode.metadata.get(cell.model);
    if (cachedData) return cachedData;

    inspector = inspector ?? getInspector(cell);

    const codeData = await inspector.getCodeData(cell);
    const data = CellCode.metadata.getCoalescedValue(codeData);
    CellCode.metadata.set(cell.model, data);
    return data;
  }
}

export class CodeContext implements ICodeContext {
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
    this._inspectorCache = new Cache<CodeInspector>(
      () => CellCode.getInspector(cell),
      inspector
    );
  }

  createAnother(cell: CodeCell): ICodeContext {
    return new CodeContext(cell, this.inspector);
  }

  getConfig(): ICodeConfig {
    return CellConfig.get(this.cell.model);
  }

  async getData(): Promise<CellCode.IData> {
    return CellCode.getData(this.cell, this.inspector);
  }

  /**
   * Cell variables 중 uncached 리턴
   */
  async getUncachedVariables(variables?: string[]): Promise<string[]> {
    if (!variables) {
      const data = await this.getData();
      variables = data.variables;
    }
    return this.inspector.filterNonKernelVariables(variables);
  }

  /**
   * Cell variables cached 여부 리턴
   */
  async isCached(variables?: string[]): Promise<boolean> {
    const uncachedVars = await this.getUncachedVariables(variables);
    return !uncachedVars.length;
  }

  /**
   * Cell unbound variables 중 uncached 리턴
   */
  async getUncachedUnboundVariables(): Promise<string[]> {
    const data = await this.getData();
    return this.inspector.filterNonKernelVariables(data.unboundVariables);
  }

  /**
   * 셀 실행 계획 수집 (dependent cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependent cells 수집
   */
  async buildExecutionPlan(): Promise<IExecutionPlan> {
    Log.debug(`cell execution plan { (${this.cell.model.id})`);

    const planner = new ExecutionPlanner(this);
    const plan = await planner.build();
    CellExecution.saveMetadata(plan);

    Log.debug(`} cell execution plan (${this.cell.model.id})`, plan);
    return plan;
  }
}
