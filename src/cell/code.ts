import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { CellConfig } from './config';
import { CodeInspector, ICodeVariables } from '../code';
import { isCodeCell, getAboveCodeCells } from '../utils/cell';
import { Cache } from '../utils/cache';
import { CellError } from '../utils/error';
import { notIn } from '../utils/array';

export namespace CodeContext {
  export type IExecutionVariables = ICodeVariables & {
    /**
     * unboundVariables에서 kernel variables 제외한 변수들
     */
    unresolvedVariables: string[];
  };

  export interface IDependency {
    context: CodeContext;
    dependencies?: IDependency[];

    /**
     * resolve 하려는 target variables
     * 최초 셀 unboundVariables에서 kernel variables 제외한 변수들
     * 이후 sub-dependency에서는 현재 셀의 unresolvedVariables 전달
     */
    targetVariables: string[];

    /**
     * target variables 중 code variables(CellMetadata.ICode)의 out variables
     */
    resolvedVariables: string[];

    /**
     * target variables 중 resolvedVariables를 제외한 나머지와
     * code context의 새로운 unboundVariables (kernel variables 제외)
     */
    unresolvedVariables: string[];
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
  async getMetadata(): Promise<CellMetadata.ICode> {
    const cachedMetadata = CellMetadata.Code.get(this.cell.model);
    if (cachedMetadata) return cachedMetadata;

    const codeVars = await this.inspector.getCodeVariables(this.cell);
    const metadata = CellMetadata.Code.getCoalescedValue(codeVars);
    CellMetadata.Code.set(this.cell.model, metadata);
    return metadata;
  }

  /**
   * Cell variables cached 여부 리턴
   */
  async isVariablesCached(): Promise<boolean> {
    const metadata = await this.getMetadata();
    const vars = metadata.variables;
    const uncachedVars = this.inspector.filterNonKernelVariables(vars);
    return !uncachedVars.length;
  }

  /**
   * 실행 셀 목록 수집 (dependent cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependent cells 수집
   */
  async getCellsToExecute(): Promise<CodeCell[] | void> {
    const config = CellConfig.get(this.cell);
    if (config.skip) return;
    if (config.cache) {
      const cached = await this.isVariablesCached();
      if (cached) return;
    }

    const dependentCells = await this._getDependentCells();
    const cellsToExecute = dependentCells
      ? [...dependentCells, this.cell]
      : [this.cell];
    console.log('cellsToExecute', cellsToExecute);
    return cellsToExecute;
  }

  /**
   * unbound variables resolve 위한 dependent cells 수집
   */
  private async _getDependentCells(): Promise<CodeCell[] | void> {
    const metadata = await this.getMetadata();
    const unboundVars = metadata.unboundVariables; // TODO: uncached unbound
    if (!unboundVars.length) return;

    const scanCells = getAboveCodeCells(this.cell).reverse();
    console.log('scan cells', scanCells);
    if (!scanCells.length) return;

    const scanContexts = scanCells.map(
      cell => new CodeContext(cell, this.inspector)
    );
    const dependency = this._buildDependency(this, scanContexts, unboundVars);
    dependency;
    const dependentCells: CodeCell[] = []; // collectDependencyCells, ##Execution 기록 w/ targetCell id
    return dependentCells;
  }

  private async _buildDependency(
    context: CodeContext,
    scanContexts: CodeContext[],
    targetVariables: string[]
  ): Promise<CodeContext.IDependency> {
    if (!targetVariables.length) {
      return {
        context,
        targetVariables,
        resolvedVariables: [],
        unresolvedVariables: []
      };
    }

    const dependencies: CodeContext.IDependency[] = [];
    const resolved: string[] = [];
    const unresolved: string[] = targetVariables.slice();

    for (let i = 0; i < scanContexts.length; ++i) {
      const itemContext = scanContexts[i];
      const itemScanContexts = scanContexts.slice(i + 1);
      const itemDependency = this._buildDependencyItem(
        itemContext,
        itemScanContexts,
        targetVariables
      );

      console.log('dependency', itemContext, itemDependency);

      if (!itemDependency) continue;

      // resolved += itemDependenct.resolvedVariables
      // unresolved -= resolved, uncached unbound는?
    }

    return {
      context,
      dependencies,
      targetVariables,
      resolvedVariables: resolved,
      unresolvedVariables: unresolved
    };
  }

  private async _buildDependencyItem(
    context: CodeContext,
    scanContexts: CodeContext[],
    targetVariables: string[]
  ): Promise<CodeContext.IDependency | void> {
    const metadata = await context.getMetadata();

    // resolved: metadata.variables, kernel variables에 있는 변수들
    const resolvedVars = targetVariables.filter(notIn(metadata.variables));
    if (!resolvedVars.length) return;

    // const inspector = context.inspector;
    // const uncachedTargetVars =
    //   inspector.getUncachedVariables(targetVariables);
    // const uncachedUnboundVars = inspector.getUncachedVariables(
    //   metadata.unboundVariables
    // );
    // const unresolvedVariables = [...uncachedTargetVars, ...uncachedUnboundVars];
    // unresolvedVariables;
  }

  /**
   * target variables에 대한 variables context (unresolved variables)
   */
  // async getVariableContext(
  //   targetVariables: string[]
  // ): Promise<CodeContext.IVariableContext> {
  //   const metadata = await this.getMetadata();
  //   // const varsSet = new Set(metadata.variables);
  //   const uncachedTargetVars =
  //     this.inspector.getUncachedVariables(targetVariables);
  //   const uncachedUnboundVars = this.inspector.getUncachedVariables(
  //     metadata.unboundVariables
  //   );
  //   const unresolvedVariables = [...uncachedTargetVars, ...uncachedUnboundVars];
  //   Private;
  //   return {
  //     codeContext: this,
  //     targetVariables,
  //     resolvedVariables: [],
  //     unresolvedVariables
  //   };
  // }
}

// namespace Private {
//   export async function buildDependency(
//     context: CodeContext,
//     scanCells: CodeCell[],
//     targetVariables: string[]
//   ): Promise<CodeContext.IVariableContext | void> {
//     const metadata = await context.getMetadata();
//     const varsSet = new Set(metadata.variables);
//     const resolvedVars = targetVariables.filter(v => varsSet.has(v));
//     if (!resolvedVars.length) return;

//     const inspector = context.inspector;
//     const uncachedTargetVars =
//       inspector.getUncachedVariables(targetVariables);
//     const uncachedUnboundVars = inspector.getUncachedVariables(
//       metadata.unboundVariables
//     );
//     const unresolvedVariables = [...uncachedTargetVars, ...uncachedUnboundVars];
//     unresolvedVariables;
//   }
// }
