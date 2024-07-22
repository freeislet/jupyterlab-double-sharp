import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { CellConfig } from './config';
import { CellExecution } from './execution';
import { ICodeExecution, ICodeContext, ICodeConfig } from '../execution';
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

    inspector ??= getInspector(cell);
    const codeData = await inspector.getCodeData(cell);
    const data = CellCode.metadata.getCoalescedValue(codeData);
    CellCode.metadata.set(cell.model, data);
    return data;
  }

  /**
   * Cell variables cached 여부 리턴
   */
  export async function isCached(
    cell: CodeCell,
    inspector?: CodeInspector,
    variables?: string[]
  ): Promise<boolean> {
    const uncachedVars = await getUncachedVariables(cell, inspector, variables);
    return !uncachedVars.length;
  }

  /**
   * Cell variables 중 uncached 리턴
   */
  export async function getUncachedVariables(
    cell: CodeCell,
    inspector?: CodeInspector,
    variables?: string[]
  ): Promise<string[]> {
    inspector ??= getInspector(cell);
    if (!variables) {
      const data = await getData(cell, inspector);
      variables = data.variables;
    }
    return inspector.filterNonKernelVariables(variables);
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

  static fromCells(
    cells: readonly Cell[],
    inspector?: CodeInspector
  ): CodeContext[] {
    return cells.flatMap(cell => CodeContext.fromCell(cell, inspector) ?? []);
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

  getConfig(): ICodeConfig {
    return CellConfig.get(this.cell.model);
  }

  async getData(): Promise<CellCode.IData> {
    return await CellCode.getData(this.cell, this.inspector);
  }

  async isCached(variables?: string[]): Promise<boolean> {
    return await CellCode.isCached(this.cell, this.inspector, variables);
  }

  createAnother(cell: CodeCell): ICodeContext {
    return new CodeContext(cell, this.inspector);
  }

  saveExecutionData(execution: ICodeExecution) {
    CellExecution.saveMetadata(execution);
  }

  /**
   * Cell variables 중 uncached 리턴
   */
  // async getUncachedVariables(variables?: string[]): Promise<string[]> {
  //   if (!variables) {
  //     const data = await this.getData();
  //     variables = data.variables;
  //   }
  //   return this.inspector.filterNonKernelVariables(variables);
  // }

  /**
   * Cell unbound variables 중 uncached 리턴
   */
  // async getUncachedUnboundVariables(): Promise<string[]> {
  //   const data = await this.getData();
  //   return this.inspector.filterNonKernelVariables(data.unboundVariables);
  // }
}
