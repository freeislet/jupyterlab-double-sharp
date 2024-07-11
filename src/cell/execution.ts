import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellCode, CodeContext } from './code';
import { CellConfig } from './config';
import { Settings } from '../settings';
import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { getAboveCodeCells } from '../utils/cell';
import { In, notIn } from '../utils/array';
import { ReorderSet } from '../utils/set';

export namespace CellExecution {
  export interface IDependency {
    /**
     * 현재 dependency 정보의 해당 셀 CodeContext
     */
    context: CodeContext;

    /**
     * 현재 셀의 code 정보 (variables, unbound variables)
     */
    code: CellCode.IData;

    /**
     * resolve 하려는 target variables (부모 dependency의 unresolvedVariables)
     */
    targetVariables: string[];

    /**
     * targetVariables 중 현재 셀에서 resolve 가능한 variables (code.variables에 포함된 변수들)
     */
    resolvedVariables: string[];

    /**
     * targetVariables + code.unboundVariables 중 현재 셀 및 하위 dependencies에서
     * resolve하지 못 한 최종 unresolved variables
     */
    unresolvedVariables: string[];

    /**
     * targetVariables + code.unboundVariables를 resolve하기 위한 dependencies
     */
    dependencies?: IDependency[];
  }

  export interface IPlan {
    skipped?: boolean;
    cached?: boolean;
    autoDependency?: boolean;
    code?: CellCode.IData;
    unresolvedVariables?: string[];
    dependencies?: IDependency[];
    dependentCells?: CodeCell[];
    cellsToExecute?: CodeCell[]; // -> 제거, IData도
  }

  /**
   * IPlan metadata (##Execution)
   */
  export type IData = Omit<
    IPlan,
    'dependencies' | 'dependentCells' | 'cellsToExecute'
  > & {
    dependencies?: IDependencyData[];
    dependentCells?: ICellData[];
  };

  export type IDependencyData = {
    cell: ICellData;
    dependencies?: IDependencyData[];
  } & Omit<IDependency, 'context' | 'dependencies'>;

  export interface ICellData {
    modelId: string;
  }
}

export class CellExecution {
  private static _metadata = new MetadataGroup<CellExecution.IData>(
    metadataKeys.execution,
    {}
  );

  static get metadata(): MetadataGroup<CellExecution.IData> {
    return CellExecution._metadata;
  }
}

interface IDependencyInfo {
  unresolvedVariables: string[];
  dependencies?: CellExecution.IDependency[];
}

export class ExecutionPlan {
  plan: CellExecution.IPlan | null = null;

  constructor(public readonly code: CodeContext) {}

  get cell(): CodeCell {
    return this.code.cell;
  }

  async build(): Promise<CellExecution.IPlan> {
    this.plan = await this._build();
    return this.plan;
  }

  private async _build(): Promise<CellExecution.IPlan> {
    const config = CellConfig.get(this.cell.model);
    if (config.skip) {
      // this._output.printSkipped();
      return { skipped: true };
    }

    const code = await this.code.getData();

    if (config.cache) {
      const cached = await this.code.isCached(code.variables);
      if (cached) {
        // this._output.printCached(data);
        return { cached, code };
      }
    }

    if (config.autoDependency) {
      const dependencyInfo = await this._getDependencyInfo(
        code.unboundVariables
      );
      const unresolvedVariables = dependencyInfo.unresolvedVariables;
      const dependencies = dependencyInfo.dependencies;
      const dependentCells =
        !unresolvedVariables.length && dependencies // NOTE: unresolved variables 있으면 dependency 실행하지 않음
          ? this._collectDependentCells(dependencies)
          : undefined;
      return {
        cached: false,
        autoDependency: true,
        code,
        unresolvedVariables,
        dependencies,
        dependentCells,
        cellsToExecute: [...(dependentCells ?? []), this.cell]
      };
    } else {
      return {
        cached: false,
        autoDependency: false,
        code,
        cellsToExecute: [this.cell]
      };
    }
  }

  /**
   * 현재 셀 코드의 unbound variables에 대한 dependency 정보 수집
   */
  private async _getDependencyInfo(
    unboundVariables: string[]
  ): Promise<IDependencyInfo> {
    if (!unboundVariables.length) {
      return { unresolvedVariables: [] };
    }

    const scanCells = getAboveCodeCells(this.cell).reverse();
    const scanContexts = scanCells.map(
      cell => new CodeContext(cell, this.code.inspector)
    );
    return await this._buildDependencyInfo(unboundVariables, scanContexts);
  }

  /**
   * scanContexts를 대상으로 targetVariables에 대한 dependency 정보 수집 (recursively)
   */
  private async _buildDependencyInfo(
    targetVariables: string[],
    scanContexts: CodeContext[]
  ): Promise<IDependencyInfo> {
    if (!targetVariables.length) {
      return { unresolvedVariables: [] };
    }

    const dependencies: CellExecution.IDependency[] = [];

    for (let i = 0; i < scanContexts.length; ++i) {
      const scanContext = scanContexts[i];
      const rescanContexts = scanContexts.slice(i + 1);
      const dependency = await this._buildDependency(
        targetVariables,
        scanContext,
        rescanContexts
      );

      if (dependency) {
        const dependencyResolved = !dependency.unresolvedVariables.length;
        if (dependencyResolved) {
          targetVariables = targetVariables.filter(
            notIn(dependency.resolvedVariables)
          );
        }

        const saveUnresolvedDependencies = Settings.data.verbose.metadata;
        if (dependencyResolved || saveUnresolvedDependencies) {
          dependencies.push(dependency);
        }

        const allResolved = !targetVariables.length;
        if (allResolved) break;
      }
    }

    return { unresolvedVariables: targetVariables, dependencies };
  }

  /**
   * dependency scan 대상 CodeContext의 CellExecution.IDependency object 생성
   *
   * @param targetVariables resolve 하려는 variables
   * @param scanContext dependency scan 대상 CodeContext
   * @param rescanContexts scanContext의 sub-dependency를 다시 찾기 위해 scan할 CodeContexts
   * @returns scanContext의 CellExecution.IDependency object
   */
  private async _buildDependency(
    targetVariables: string[],
    scanContext: CodeContext,
    rescanContexts: CodeContext[]
  ): Promise<CellExecution.IDependency | undefined> {
    const config = CellConfig.get(scanContext.cell.model);
    if (config.skip) return;

    const code = await scanContext.getData();
    const resolvedVariables = targetVariables.filter(In(code.variables));
    if (!resolvedVariables.length) return;

    const retargetVariables = [
      ...targetVariables.filter(notIn(code.variables)),
      ...code.unboundVariables
    ];
    const dependencyInfo = await this._buildDependencyInfo(
      retargetVariables,
      rescanContexts
    );
    const dependency: CellExecution.IDependency = {
      context: scanContext,
      code,
      targetVariables,
      resolvedVariables,
      unresolvedVariables: dependencyInfo.unresolvedVariables,
      dependencies: dependencyInfo.dependencies
    };
    Log.debug('dependency', dependency);
    return dependency;
  }

  private _collectDependentCells(
    dependencies: CellExecution.IDependency[]
  ): CodeCell[] {
    const cells = new ReorderSet<CodeCell>();

    function collect(dependencies?: CellExecution.IDependency[]) {
      if (!dependencies) return;

      for (const dep of dependencies) {
        const resolved = !dep.unresolvedVariables.length; // dep.resolvedVariables.length 확인 생략
        if (resolved) {
          cells.add(dep.context.cell);
        }

        collect(dep.dependencies);
      }
    }

    collect(dependencies);
    return Array.from(cells).reverse();
  }

  saveMetadata() {
    const plan = this.plan;
    if (!plan) return;

    const metadata = Private.planData(plan);
    CellExecution.metadata.set(this.cell.model, metadata);
  }
}

namespace Private {
  export function planData(plan: CellExecution.IPlan): CellExecution.IData {
    return {
      skipped: plan.skipped,
      cached: plan.cached,
      autoDependency: plan.autoDependency,
      code: plan.code,
      unresolvedVariables: plan.unresolvedVariables,
      dependencies: plan.dependencies?.map(dependencyData),
      dependentCells: plan.dependentCells?.map(cellData)
    };
  }

  export function dependencyData(
    dependency: CellExecution.IDependency
  ): CellExecution.IDependencyData {
    return {
      cell: cellData(dependency.context.cell),
      code: dependency.code,
      targetVariables: dependency.targetVariables,
      resolvedVariables: dependency.resolvedVariables,
      unresolvedVariables: dependency.unresolvedVariables,
      dependencies: dependency.dependencies?.map(dependencyData)
    };
  }

  export function cellData(cell: Cell): CellExecution.ICellData {
    return {
      modelId: cell.model.id
    };
  }
}
