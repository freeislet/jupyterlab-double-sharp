import { CodeCell } from '@jupyterlab/cells';

import { ICodeData } from '../code';
import { Settings } from '../settings';
import { getAboveCodeCells } from '../utils/cell';
import { In, notIn } from '../utils/array';
import { ReorderSet } from '../utils/set';

export interface ICodeExecution {
  cell: CodeCell;
  config?: ICodeConfig;
  skipped?: boolean;
  cached?: boolean;
  code?: ICodeData;
  unresolvedVariables?: string[];
  dependencies?: IDependency[];
  dependentCells?: CodeCell[];
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
   * 현재 dependency 정보의 해당 셀
   */
  cell: CodeCell;

  /**
   * 현재 셀의 code 정보 (variables, unbound variables)
   */
  code: ICodeData;

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

export interface ICodeContext {
  readonly cell: CodeCell;

  createAnother(cell: CodeCell): ICodeContext;
  getConfig(): ICodeConfig;
  getData(): Promise<ICodeData>;
  isCached(variables?: string[]): Promise<boolean>;
}

interface IDependencyInfo {
  unresolvedVariables: string[];
  dependencies?: IDependency[];
}

export class CodeExecutionBuilder {
  constructor() {}

  async build(context: ICodeContext): Promise<ICodeExecution> {
    const cell = context.cell;
    const config = context.getConfig();
    if (config.skip) {
      // this._output.printSkipped();
      return { cell, config, skipped: true };
    }

    const code = await context.getData();

    if (config.cache) {
      const cached = await context.isCached(code.variables);
      if (cached) {
        // this._output.printCached(data);
        return { cell, config, cached, code };
      }
    }

    if (config.autoDependency) {
      const dependencyInfo = await this._getDependencyInfo(
        context,
        code.unboundVariables
      );
      const unresolvedVariables = dependencyInfo.unresolvedVariables;
      const dependencies = dependencyInfo.dependencies;
      const dependentCells =
        !unresolvedVariables.length && dependencies // NOTE: unresolved variables 있으면 dependency 실행하지 않음
          ? this._collectDependentCells(dependencies)
          : undefined;
      return {
        cell,
        config,
        code,
        unresolvedVariables,
        dependencies,
        dependentCells
      };
    } else {
      return {
        cell,
        config,
        code
      };
    }
  }

  /**
   * 현재 셀 코드의 unbound variables에 대한 dependency 정보 수집
   */
  private async _getDependencyInfo(
    context: ICodeContext,
    unboundVariables: string[]
  ): Promise<IDependencyInfo> {
    if (!unboundVariables.length) {
      return { unresolvedVariables: [] };
    }

    const scanCells = getAboveCodeCells(context.cell).reverse();
    const scanContexts = scanCells.map(cell => context.createAnother(cell));
    return await this._buildDependencyInfo(unboundVariables, scanContexts);
  }

  /**
   * scanContexts를 대상으로 targetVariables에 대한 dependency 정보 수집 (recursively)
   */
  private async _buildDependencyInfo(
    targetVariables: string[],
    scanContexts: ICodeContext[]
  ): Promise<IDependencyInfo> {
    if (!targetVariables.length) {
      return { unresolvedVariables: [] };
    }

    const dependencies: IDependency[] = [];

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
    scanContext: ICodeContext,
    rescanContexts: ICodeContext[]
  ): Promise<IDependency | undefined> {
    const config = scanContext.getConfig();
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
    const dependency: IDependency = {
      cell: scanContext.cell,
      code,
      targetVariables,
      resolvedVariables,
      unresolvedVariables: dependencyInfo.unresolvedVariables,
      dependencies: dependencyInfo.dependencies
    };
    Log.debug('dependency', dependency);
    return dependency;
  }

  private _collectDependentCells(dependencies: IDependency[]): CodeCell[] {
    const cells = new ReorderSet<CodeCell>();

    function collect(dependencies?: IDependency[]) {
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
    return Array.from(cells).reverse();
  }
}
