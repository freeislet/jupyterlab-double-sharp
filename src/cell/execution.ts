import { Cell } from '@jupyterlab/cells';

import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { ICodeExecution, IDependency, IDependencyItem } from '../execution';

export namespace CellExecution {
  /**
   * ICodeExecution metadata (##Execution)
   */
  export type IData = {
    cell?: ICellData;
    dependency?: IDependencyData;
    dependencyCells?: ICellData[];
  } & Partial<Omit<ICodeExecution, 'cell' | 'dependency' | 'dependencyCells'>>;

  export type IDependencyData = {
    dependencies?: IDependencyItemData[];
  } & Omit<IDependency, 'dependencies'>;

  export type IDependencyItemData = {
    cell: ICellData;
    dependency?: IDependencyData;
  } & Omit<IDependencyItem, 'cell' | 'dependency'>;

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

export namespace CellExecution {
  export function saveMetadata(execution: ICodeExecution) {
    const metadata = executionData(execution);
    CellExecution.metadata.set(execution.cell.model, metadata);
  }

  function executionData(execution: ICodeExecution): CellExecution.IData {
    return {
      cell: cellData(execution.cell),
      options: execution.options,
      config: execution.config,
      skipped: execution.skipped,
      cached: execution.cached,
      code: execution.code,
      dependency: dependencyData(execution.dependency),
      dependencyCells: execution.dependencyCells?.map(cellData)
    };
  }

  function dependencyData(
    dependency: IDependency | undefined
  ): CellExecution.IDependencyData | undefined {
    if (!dependency) return;
    return {
      resolved: dependency.resolved,
      unresolvedVariables: dependency.unresolvedVariables,
      dependencies: dependency.dependencies?.map(dependencyItemData)
    };
  }

  function dependencyItemData(
    dependencyItem: IDependencyItem
  ): CellExecution.IDependencyItemData {
    return {
      cell: cellData(dependencyItem.cell),
      code: dependencyItem.code,
      targetVariables: dependencyItem.targetVariables,
      resolvedVariables: dependencyItem.resolvedVariables,
      dependency: dependencyData(dependencyItem.dependency)
    };
  }

  function cellData(cell: Cell): CellExecution.ICellData {
    return {
      modelId: cell.model.id
    };
  }
}
