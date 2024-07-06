import { Cell, CodeCell } from '@jupyterlab/cells';

import { CodeContext } from './code';
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
     * 현재 셀의 unresolved variables를 resolve하기 위한 dependencies
     */
    dependencies?: IDependency[];

    /**
     * resolve 하려는 target variables (부모 dependency의 unresolvedVariables)
     */
    targetVariables: string[];

    /**
     * target variables 중 code variables(CellMetadata.ICode)의 out variables
     */
    resolvedVariables: string[];

    /**
     * 현재 code context의 out variables (ICodeVariables.variables)
     */
    cellVariables: string[];

    /**
     * 현재 code context의 unbound & uncached variables (IExecutionVariables.unresolvedVariables)
     */
    unresolvedCellVariables: string[];

    /**
     * unresolvedCellVariables 중 하위 dependencies에서 resolve하지 못 한 최종 unresolved variables
     */
    unresolvedVariables: string[];
  }

  export interface IPlan {
    skipped?: boolean;
    cached?: boolean;
    autoDependency?: boolean;
    cellsToExecute?: CodeCell[];
    dependentCells?: CodeCell[];
    dependency?: IDependency;
    outVariables?: string[];
  }

  // metadata

  export interface ICellData {
    modelId: string;
  }

  export type IDependencyData = {
    cell: ICellData;
    dependencies?: IDependencyData[];
  } & Omit<IDependency, 'context' | 'dependencies'>;

  export type IDependencyRootData = Omit<
    IDependencyData,
    'targetVariables' | 'resolvedVariables'
  >;

  /**
   * IPlan metadata (##Execution)
   */
  export interface IData {
    skipped?: boolean;
    cached?: boolean;
    cells?: ICellData[];
    dependency?: IDependencyRootData;
    outVariables?: string[];
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
    let cached: boolean | undefined;

    const config = CellConfig.get(this.cell.model);
    if (config.skip) {
      // this._output.printSkipped();
      return { skipped: true };
    }
    if (config.cache) {
      cached = await this.code.isCached();
      if (cached) {
        const data = await this.code.getData();
        // this._output.printCached(data);
        return { cached, outVariables: data.variables };
      }
    }
    if (config.autoDependency) {
      const dependency = await this._buildDependency();
      const dependencyResolved = dependency?.unresolvedVariables.length === 0;
      const dependentCells = dependencyResolved
        ? this._collectDependentCells(dependency)
        : [];
      const data = await this.code.getData();
      return {
        cached,
        autoDependency: true,
        cellsToExecute: [...dependentCells, this.cell],
        dependentCells,
        dependency,
        // outVariables: dependency?.cellVariables
        // NOTE: 현재 variables가 이미 kernel variables에 있으면 dependency 수집 생략
        outVariables: data.variables
      };
    } else {
      const data = await this.code.getData();
      return {
        cached,
        autoDependency: false,
        cellsToExecute: [this.cell],
        outVariables: data.variables
      };
    }
  }

  /**
   * 현재 셀 코드의 dependency 수집
   */
  private async _buildDependency(): Promise<
    CellExecution.IDependency | undefined
  > {
    // console.debug('_buildDependency {', this.cell);

    const execVars = await this.code.getExecutionVariables();
    const unresolvedVars = execVars.unresolvedVariables;
    if (!unresolvedVars.length) return;

    const scanCells = getAboveCodeCells(this.cell).reverse();
    const scanContexts = scanCells.map(
      cell => new CodeContext(cell, this.code.inspector)
    );
    // console.debug('scan contexts', scanContexts);
    if (!scanContexts.length) return;

    const dependency: CellExecution.IDependency = {
      context: this.code,
      targetVariables: [],
      resolvedVariables: [],
      cellVariables: execVars.variables,
      unresolvedCellVariables: unresolvedVars,
      unresolvedVariables: unresolvedVars
    };

    await this._buildDependencies(dependency, scanContexts);
    // console.debug('} _buildDependency', this.cell);
    return dependency;
  }

  /**
   * base IDependency object의 dependencies 수집 및 unresolvedVariables 업데이트
   */
  private async _buildDependencies(
    base: CellExecution.IDependency,
    scanContexts: CodeContext[]
  ) {
    let unresolvedVars = base.unresolvedVariables;
    if (!unresolvedVars.length) return;

    const dependencies: CellExecution.IDependency[] = [];

    for (let i = 0; i < scanContexts.length; ++i) {
      const scanContext = scanContexts[i];
      const rescanContexts = scanContexts.slice(i + 1);
      const dependency = await this._buildDependencyItem(
        scanContext,
        unresolvedVars,
        rescanContexts
      );

      if (dependency) {
        const dependencyResolved = !dependency.unresolvedVariables.length;
        if (dependencyResolved) {
          unresolvedVars = unresolvedVars.filter(
            notIn(dependency.resolvedVariables)
          );
        }

        const saveUnresolvedDependencies = Settings.data.verbose.metadata;
        if (dependencyResolved || saveUnresolvedDependencies) {
          dependencies.push(dependency);
        }

        const allResolved = !unresolvedVars.length;
        if (allResolved) break;
      }
    }

    base.dependencies = dependencies;
    base.unresolvedVariables = unresolvedVars;
  }

  /**
   * dependency scan 대상 CodeContext의 IDependency object 생성
   * @param scanContext dependency scan 대상 CodeContext
   * @param targetVariables resolve 하려는 target variables. kernel variables 제외해서 전달해야 함
   * @param rescanContexts scanContext의 sub-dependency를 다시 찾기 위해 scan할 CodeContexts
   * @returns dependency object
   */
  private async _buildDependencyItem(
    scanContext: CodeContext,
    targetVariables: string[],
    rescanContexts: CodeContext[]
  ): Promise<CellExecution.IDependency | undefined> {
    const config = CellConfig.get(scanContext.cell.model);
    if (config.skip) return;

    const execVars = await scanContext.getExecutionVariables();
    const resolvedVars = targetVariables.filter(In(execVars.variables));
    if (!resolvedVars.length) return;

    const unresolvedCellVars = execVars.unresolvedVariables;
    const dependency: CellExecution.IDependency = {
      context: scanContext,
      targetVariables,
      resolvedVariables: resolvedVars,
      cellVariables: execVars.variables,
      unresolvedCellVariables: unresolvedCellVars,
      unresolvedVariables: unresolvedCellVars
    };

    await this._buildDependencies(dependency, rescanContexts);

    Log.debug('dependency item', dependency);
    return dependency;
  }

  private _collectDependentCells(
    dependency: CellExecution.IDependency
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

    collect(dependency.dependencies);
    return Array.from(cells).reverse();
  }

  saveMetadata() {
    const plan = this.plan;
    if (!plan) return;

    const metadata: CellExecution.IData = {
      skipped: plan.skipped,
      cached: plan.cached,
      cells: plan.cellsToExecute?.map(Private.cellData),
      dependency: Private.dependencyRootData(plan.dependency),
      outVariables: plan.outVariables
    };
    CellExecution.metadata.set(this.cell.model, metadata);
  }
}

namespace Private {
  export function dependencyRootData(
    dependency?: CellExecution.IDependency
  ): CellExecution.IDependencyRootData | undefined {
    if (!dependency) return;
    return {
      cell: cellData(dependency.context.cell),
      dependencies: dependency.dependencies?.map(dependencyData),
      cellVariables: dependency.cellVariables,
      unresolvedCellVariables: dependency.unresolvedCellVariables,
      unresolvedVariables: dependency.unresolvedVariables
    };
  }

  export function dependencyData(
    dependency: CellExecution.IDependency
  ): CellExecution.IDependencyData {
    return {
      cell: cellData(dependency.context.cell),
      dependencies: dependency.dependencies?.map(dependencyData),
      targetVariables: dependency.targetVariables,
      resolvedVariables: dependency.resolvedVariables,
      cellVariables: dependency.cellVariables,
      unresolvedCellVariables: dependency.unresolvedCellVariables,
      unresolvedVariables: dependency.unresolvedVariables
    };
  }

  export function cellData(cell: Cell): CellExecution.ICellData {
    return {
      modelId: cell.model.id
    };
  }
}
