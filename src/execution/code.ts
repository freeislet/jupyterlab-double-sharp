import { CodeCell } from '@jupyterlab/cells';

import { ICodeData } from '../code';
import { Settings } from '../settings';
import { getAboveCodeCells, sortCells } from '../utils/cell';
import { In, notIn, uniq } from '../utils/array';

export interface ICodeExecution {
  cell: CodeCell;
  forced?: boolean;
  config?: ICodeConfig;
  skipped?: boolean;
  cached?: boolean;
  code?: ICodeData;
  dependency?: IDependency;
  dependencyCells?: CodeCell[];
}

/**
 * CodeCell 실행 config (== NonNullableField<CellConfig.IData>)
 */
export interface ICodeConfig {
  skip: boolean;
  cache: boolean;
  autoDependency: boolean;
}

export interface IDependency {
  unresolvedVariables: string[];
  dependencies?: IDependencyItem[];
}

export interface IDependencyItem {
  /**
   * 현재 dependency 정보의 해당 셀
   */
  cell: CodeCell;

  /**
   * 현재 셀의 code 정보 (variables, unbound variables)
   */
  code: ICodeData;

  /**
   * resolve 하려는 target variables (이전 dependency의 unresolvedVariables)
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
   * code.unboundVariables를 resolve하기 위한 dependencies
   */
  dependencies?: IDependencyItem[];
}

export interface ICodeContext {
  readonly cell: CodeCell;

  getConfig(): ICodeConfig;
  getData(): Promise<ICodeData>;
  isCached(variables?: string[]): Promise<boolean>;
  saveExecutionData(execution: ICodeExecution): void;
  isForced(): boolean;
  createAnother(cell: CodeCell): ICodeContext;
}

export class CodeExecutionBuilder {
  constructor() {}

  /**
   * 셀 실행 계획 수집 (dependency cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependency cells 수집
   */
  async build(
    context: ICodeContext,
    forceExecute?: boolean
  ): Promise<ICodeExecution> {
    Log.debug(`code execution { (${context.cell.model.id})`);

    const execution = await this._build(context, forceExecute);
    context.saveExecutionData(execution);

    Log.debug(`} code execution (${context.cell.model.id})`, execution);
    return execution;
  }

  private async _build(
    context: ICodeContext,
    forced: boolean | undefined
  ): Promise<ICodeExecution> {
    const cell = context.cell;
    const config = context.getConfig();
    const execution: ICodeExecution = { cell, forced, config };

    if (config.skip && !forced) {
      // this._output.printSkipped();
      return { ...execution, skipped: true };
    }

    const code = await context.getData();
    execution.code = code;

    if (config.cache && !forced) {
      const cached = await context.isCached(code.variables);
      if (cached) {
        // this._output.printCached(data);
        return { ...execution, cached };
      }
    }

    if (config.autoDependency) {
      const dependency = await this._getDependency(
        context,
        code.unboundVariables
      );
      const dependencyCells = this._collectDependencyCells(dependency);
      return {
        ...execution,
        dependency,
        dependencyCells
      };
    } else {
      return execution;
    }
  }

  /**
   * 현재 셀 코드의 unbound variables에 대한 dependency 정보 수집
   */
  private async _getDependency(
    context: ICodeContext,
    unboundVariables: string[]
  ): Promise<IDependency | undefined> {
    if (!unboundVariables.length) return;

    const scanCells = getAboveCodeCells(context.cell).reverse();
    const scanContexts = scanCells.map(cell => context.createAnother(cell));
    return await this._buildDependency(unboundVariables, scanContexts);
  }

  /**
   * scanContexts를 대상으로 targetVariables에 대한 dependency 정보 수집
   */
  private async _buildDependency(
    targetVariables: string[],
    scanContexts: ICodeContext[]
  ): Promise<IDependency | undefined> {
    if (!targetVariables.length) return;

    const dependencies: IDependencyItem[] = [];

    for (let i = 0; i < scanContexts.length; ++i) {
      const scanContext = scanContexts[i];
      const rescanContexts = scanContexts.slice(i + 1);
      const dependency = await this._buildDependencyItem(
        targetVariables,
        scanContext,
        rescanContexts
      );

      if (dependency) {
        const dependencyResolved = !dependency.unresolvedVariables.length;
        if (dependencyResolved) {
          Log.debug('- resolved dep', scanContext.cell.model.id, dependency);

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
  private async _buildDependencyItem(
    targetVariables: string[],
    scanContext: ICodeContext,
    rescanContexts: ICodeContext[]
  ): Promise<IDependencyItem | undefined> {
    const config = scanContext.getConfig();
    if (config.skip) return;

    const code = await scanContext.getData();
    const resolvedVariables = targetVariables.filter(In(code.variables));
    if (!resolvedVariables.length) return;

    Log.debug('dependency {', scanContext.cell.model.id, targetVariables);

    let unresolvedVariables = targetVariables.filter(notIn(resolvedVariables));
    let dependencies: IDependencyItem[] | undefined;

    if (code.unboundVariables) {
      // 셀 자체 unbound variables 있으면, 재귀적으로 dependency 수집해서 resolve
      const retargetVariables = uniq(
        unresolvedVariables.concat(code.unboundVariables)
      );
      const dependency = await this._buildDependency(
        retargetVariables,
        rescanContexts
      );
      if (dependency) {
        unresolvedVariables = dependency.unresolvedVariables;
        dependencies = dependency.dependencies;
      }
    }

    const dependencyItem: IDependencyItem = {
      cell: scanContext.cell,
      code,
      targetVariables,
      resolvedVariables,
      unresolvedVariables,
      dependencies
    };
    Log.debug('} dependency', scanContext.cell.model.id, dependencyItem);
    return dependencyItem;
  }

  private _collectDependencyCells(
    dependency: IDependency | undefined
  ): CodeCell[] | undefined {
    if (!dependency) return;

    const { unresolvedVariables, dependencies } = dependency;
    const valid = dependencies && !unresolvedVariables.length; // NOTE: unresolved variables 있으면 dependency 실행하지 않음
    if (!valid) return;

    const cells = new Set<CodeCell>();

    function collect(dependencies?: IDependencyItem[]) {
      if (!dependencies) return;

      for (const dep of dependencies) {
        const resolved = !dep.unresolvedVariables.length; // dep.resolvedVariables.length 확인 생략
        if (resolved) {
          cells.add(dep.cell);
        }

        collect(dep.dependencies);
      }
    }

    collect(dependencies);

    const sortedCells = sortCells([...cells]);
    Log.debug('collectDependencyCells', sortedCells);
    return sortedCells;
  }
}
