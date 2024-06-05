import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { CellConfig } from './config';
import { CodeInspector, ICodeVariables } from '../code';
import { Settings } from '../settings';
import { isCodeCell, getAboveCodeCells } from '../utils/cell';
import { Cache } from '../utils/cache';
import { CellError } from '../utils/error';
import { In, notIn } from '../utils/array';
import { ReorderSet } from '../utils/set';

export namespace CellCode {
  export type IExecutionVariables = ICodeVariables & {
    /**
     * unboundVariables에서 kernel variables 제외한 변수들
     */
    unresolvedVariables: string[];
  };

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
     * 현재 code context의 unbound & uncached variables (IExecutionVariables.unresolvedVariables)
     */
    unresolvedCellVariables: string[];

    /**
     * unresolvedCellVariables 중 하위 dependencies에서 resolve하지 못 한 최종 unresolved variables
     */
    unresolvedVariables: string[];
  }

  export interface IExecutionPlan {
    skipped?: boolean;
    cached?: boolean;
    autoDependency?: boolean;
    cellsToExecute?: CodeCell[];
    dependentCells?: CodeCell[];
    dependency?: IDependency;
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
    const cachedMetadata = CellMetadata.code.get(this.cell.model);
    if (cachedMetadata) return cachedMetadata;

    const codeVars = await this.inspector.getCodeVariables(this.cell);
    const metadata = CellMetadata.code.getCoalescedValue(codeVars);
    CellMetadata.code.set(this.cell.model, metadata);
    return metadata;
  }

  /**
   * ICode metadata + IExecutionVariables(unresolved variables) 조회
   */
  async getExecutionVariables(): Promise<CellCode.IExecutionVariables> {
    const metadata = await this.getMetadata();
    const unresolvedVariables = this.inspector.filterNonKernelVariables(
      metadata.unboundVariables
    );
    const execVars = { ...metadata, unresolvedVariables };
    // console.debug('execution variables', execVars);
    return execVars;
  }

  /**
   * Cell variables cached 여부 리턴
   */
  async isVariablesCached(): Promise<boolean> {
    const metadata = await this.getMetadata();
    const uncachedVars = this.inspector.filterNonKernelVariables(
      metadata.variables
    );
    return !uncachedVars.length;
  }

  /**
   * 셀 실행 계획 수집 (dependent cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependent cells 수집
   */
  async buildExecutionPlan(): Promise<CellCode.IExecutionPlan> {
    Log.debug(`cell execution plan { (${this.cell.model.id})`);

    const plan = await this._buildExecutionPlan();
    this._saveExecutionPlan(plan);

    Log.debug(`} cell execution plan (${this.cell.model.id})`, plan);
    return plan;
  }

  private async _buildExecutionPlan(): Promise<CellCode.IExecutionPlan> {
    let cached: boolean | undefined;

    const config = CellConfig.get(this.cell.model);
    if (config.skip) return { skipped: true };
    if (config.useCache) {
      cached = await this.isVariablesCached();
      if (cached) return { cached };
    }

    if (config.autoDependency) {
      const dependency = await this._buildDependency();
      const dependencyResolved = dependency?.unresolvedVariables.length === 0;
      const dependentCells = dependencyResolved
        ? this._collectDependentCells(dependency)
        : [];
      return {
        cached,
        autoDependency: true,
        cellsToExecute: [...dependentCells, this.cell],
        dependentCells,
        dependency
      };
    } else {
      return { cached, autoDependency: false, cellsToExecute: [this.cell] };
    }
  }

  /**
   * 현재 셀 코드의 dependency 수집
   */
  private async _buildDependency(): Promise<CellCode.IDependency | undefined> {
    // console.debug('_buildDependency {', this.cell);

    const execVars = await this.getExecutionVariables();
    const unresolvedVars = execVars.unresolvedVariables;
    if (!unresolvedVars.length) return;

    const scanCells = getAboveCodeCells(this.cell).reverse();
    const scanContexts = scanCells.map(
      cell => new CodeContext(cell, this.inspector)
    );
    // console.debug('scan contexts', scanContexts);
    if (!scanContexts.length) return;

    const dependency: CellCode.IDependency = {
      context: this,
      targetVariables: [],
      resolvedVariables: [],
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
    base: CellCode.IDependency,
    scanContexts: CodeContext[]
  ) {
    let unresolvedVars = base.unresolvedVariables;
    if (!unresolvedVars.length) return;

    const dependencies: CellCode.IDependency[] = [];

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

        const saveUnresolvedDependencies = Settings.settings.verbose.metadata;
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
  ): Promise<CellCode.IDependency | undefined> {
    const config = CellConfig.get(scanContext.cell.model);
    if (config.skip) return;

    const execVars = await scanContext.getExecutionVariables();
    const resolvedVars = targetVariables.filter(In(execVars.variables));
    if (!resolvedVars.length) return;

    const unresolvedCellVars = execVars.unresolvedVariables;
    const dependency: CellCode.IDependency = {
      context: scanContext,
      targetVariables,
      resolvedVariables: resolvedVars,
      unresolvedCellVariables: unresolvedCellVars,
      unresolvedVariables: unresolvedCellVars
    };

    await this._buildDependencies(dependency, rescanContexts);

    Log.debug('dependency item', dependency);
    return dependency;
  }

  private _collectDependentCells(dependency: CellCode.IDependency): CodeCell[] {
    const cells = new ReorderSet<CodeCell>();

    function collect(dependencies?: CellCode.IDependency[]) {
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

  private _saveExecutionPlan(plan: CellCode.IExecutionPlan) {
    const metadata: CellMetadata.IExecution = {
      skipped: plan.skipped,
      cached: plan.cached,
      cells: plan.cellsToExecute?.map(Private.cellMetadata),
      dependency: Private.dependencyRootMetadata(plan.dependency)
    };
    CellMetadata.execution.set(this.cell.model, metadata);
  }
}

namespace Private {
  export function cellMetadata(cell: Cell): CellMetadata.IExecutionCell {
    return {
      modelId: cell.model.id
    };
  }

  export function dependencyRootMetadata(
    dependency?: CellCode.IDependency
  ): CellMetadata.IExecutionDependencyRoot | undefined {
    if (!dependency) return;
    return {
      cell: cellMetadata(dependency.context.cell),
      dependencies: dependency.dependencies?.map(dependencyMetadata),
      unresolvedCellVariables: dependency.unresolvedCellVariables,
      unresolvedVariables: dependency.unresolvedVariables
    };
  }

  export function dependencyMetadata(
    dependency: CellCode.IDependency
  ): CellMetadata.IExecutionDependency {
    return {
      cell: cellMetadata(dependency.context.cell),
      dependencies: dependency.dependencies?.map(dependencyMetadata),
      targetVariables: dependency.targetVariables,
      resolvedVariables: dependency.resolvedVariables,
      unresolvedCellVariables: dependency.unresolvedCellVariables,
      unresolvedVariables: dependency.unresolvedVariables
    };
  }
}
