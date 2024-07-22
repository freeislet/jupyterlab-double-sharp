import { CodeCell } from '@jupyterlab/cells';

import { ICodeData } from '../code';
import { getAboveCodeCells, sortCells } from '../utils/cell';
import { In, notIn } from '../utils/array';

export interface ICodeExecution {
  cell: CodeCell;
  options?: ICodeExecutionOptions;
  config?: ICodeConfig;
  skipped?: boolean;
  cached?: boolean;
  code?: ICodeData;
  dependency?: IDependency;
  dependencyCells?: CodeCell[];
}

export interface ICodeExecutionOptions {
  ignoreCache?: boolean;
  saveUnresolvedDependencies?: boolean;
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
  /**
   * resolve 여부
   */
  resolved: boolean;

  /**
   * code.unboundVariables 중 unresolved 목록
   * unresolvedVariables가 있으면 해당 셀은 실행하지 않음
   */
  unresolvedVariables?: string[];

  /**
   * 현재 셀 code.unboundVariables에 대한 dependency 목록
   */
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
   * 현재 셀 code.unboundVariables를 resolve하기 위한 dependency 정보
   * unbound variables가 있을 때에만 dependency 저장
   */
  dependency?: IDependency;
}

export interface ICodeContext {
  readonly cell: CodeCell;

  getConfig(): ICodeConfig;
  getData(): Promise<ICodeData>;
  isCached(variables?: string[]): Promise<boolean>;
  createAnother(cell: CodeCell): ICodeContext;
  saveExecutionData(execution: ICodeExecution): void;
}

export class CodeExecutionBuilder {
  constructor(public readonly options?: ICodeExecutionOptions) {}

  /**
   * 셀 실행 계획 수집 (dependency cells 포함)
   * - skip, cache 처리 (실행 여부 판단)
   * - unbound variables resolve 위한 dependency cells 수집
   */
  async build(context: ICodeContext): Promise<ICodeExecution> {
    // Log.debug(`code execution { (${context.cell.model.id})`);

    const execution = await this._build(context);
    context.saveExecutionData(execution);

    // Log.debug(`} code execution (${context.cell.model.id})`, execution);
    return execution;
  }

  private async _build(context: ICodeContext): Promise<ICodeExecution> {
    const cell = context.cell;
    const options = this.options;
    const config = context.getConfig();
    const execution: ICodeExecution = { cell, options, config };

    if (config.skip) {
      // this._output.printSkipped();
      return { ...execution, skipped: true };
    }

    const code = await context.getData();
    execution.code = code;

    if (config.cache && !options?.ignoreCache) {
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
   * scanContexts를 대상으로 unboundVariables에 대한 dependency 정보 수집
   */
  private async _buildDependency(
    unboundVariables: string[],
    scanContexts: ICodeContext[]
  ): Promise<IDependency> {
    let unresolvedVariables = unboundVariables;
    const dependencies: IDependencyItem[] = [];

    for (let i = 0; i < scanContexts.length; ++i) {
      const allResolved = !unresolvedVariables.length;
      if (allResolved) break;

      const dependencyItem = await this._buildDependencyItem(
        unresolvedVariables,
        scanContexts[i],
        () => scanContexts.slice(i + 1)
      );
      if (dependencyItem) {
        dependencies.push(dependencyItem);

        unresolvedVariables = unresolvedVariables.filter(
          notIn(dependencyItem.resolvedVariables)
        );
      }
    }

    const resolved = !unresolvedVariables.length;
    const dependency = resolved
      ? { resolved, dependencies }
      : this.options?.saveUnresolvedDependencies
        ? { resolved, unresolvedVariables, dependencies }
        : { resolved, unresolvedVariables };
    // Log.debug('* dependency', unboundVariables, dependency);
    return dependency;
  }

  /**
   * dependency scan 대상 CodeContext의 IDependencyItem 생성
   *
   * @param targetVariables resolve 하려는 variables
   * @param scanContext dependency scan 대상 CodeContext
   * @param rescanContextsFn scanContext의 sub-dependency를 다시 찾기 위해 scan할 CodeContexts 조회 함수
   * @returns scanContext의 IDependencyItem
   */
  private async _buildDependencyItem(
    targetVariables: string[],
    scanContext: ICodeContext,
    rescanContextsFn: () => ICodeContext[]
  ): Promise<IDependencyItem | undefined> {
    const config = scanContext.getConfig();
    if (config.skip) return;

    const code = await scanContext.getData();

    let resolvedVariables = targetVariables.filter(In(code.variables));
    if (!resolvedVariables.length) return;

    // const id = scanContext.cell.model.id;
    // Log.debug('dependency {', id, targetVariables, resolvedVariables);

    let dependency: IDependency | undefined;

    const unboundVars = code.unboundVariables;
    if (unboundVars.length) {
      // 셀 자체 unbound variables 있으면, 재귀적으로 dependency 수집해서 resolve
      dependency = await this._buildDependency(unboundVars, rescanContextsFn());

      // dependency unresolved 시 리턴, 또는, resolvedVariables 제거 (verbose 세팅에 따라)
      if (!dependency.resolved) {
        if (this.options?.saveUnresolvedDependencies) {
          resolvedVariables = [];
        } else {
          // Log.debug('} dependency (not resolved):', id);
          return;
        }
      }
    }

    const dependencyItem: IDependencyItem = {
      cell: scanContext.cell,
      code,
      targetVariables,
      resolvedVariables,
      dependency
    };
    // Log.debug('} dependency:', id, dependencyItem);
    return dependencyItem;
  }

  private _collectDependencyCells(
    dependency: IDependency | undefined
  ): CodeCell[] | undefined {
    if (!dependency?.resolved) return; // NOTE: resolved dependency만 실행

    const cells = new Set<CodeCell>();

    function collect(dependency: IDependency) {
      for (const dependencyItem of dependency.dependencies!) {
        const resolved = dependencyItem.resolvedVariables.length > 0;
        if (resolved) {
          cells.add(dependencyItem.cell);
        }

        const subDependency = dependencyItem.dependency;
        if (subDependency?.resolved) {
          collect(subDependency);
        }
      }
    }

    collect(dependency);

    const sortedCells = sortCells([...cells]);
    // Log.debug('collectDependencyCells', sortedCells);
    return sortedCells;
  }
}

export namespace CodeExecution {
  export async function build(
    context: ICodeContext,
    options?: ICodeExecutionOptions
  ): Promise<ICodeExecution> {
    const builder = new CodeExecutionBuilder(options);
    const execution = await builder.build(context);
    return execution;
  }

  export async function buildMultiple(
    contexts: ICodeContext[],
    options?: ICodeExecutionOptions
  ): Promise<ICodeExecution[]> {
    const builder = new CodeExecutionBuilder(options);
    const executions = await Promise.all(
      contexts.map(context => builder.build(context))
    );
    return executions;
  }
}
