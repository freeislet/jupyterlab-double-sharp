import { Cell } from '@jupyterlab/cells';

import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { ICodeExecution, IDependencyItem } from '../execution';

export namespace CellExecution {
  /**
   * ICodeExecution metadata (##Execution)
   */
  export type IData = {
    cell?: ICellData;
    dependencies?: IDependencyItemData[];
    dependencyCells?: ICellData[];
  } & Partial<
    Omit<ICodeExecution, 'cell' | 'dependencies' | 'dependencyCells'>
  >;

  export type IDependencyItemData = {
    cell: ICellData;
    dependencies?: IDependencyItemData[];
  } & Omit<IDependencyItem, 'cell' | 'dependencies'>;

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
      forced: execution.forced,
      config: execution.config,
      skipped: execution.skipped,
      cached: execution.cached,
      code: execution.code,
      unresolvedVariables: execution.unresolvedVariables,
      dependencies: execution.dependencies?.map(dependencyItemData),
      dependencyCells: execution.dependencyCells?.map(cellData)
    };
  }

  function dependencyItemData(
    dependency: IDependencyItem
  ): CellExecution.IDependencyItemData {
    return {
      cell: cellData(dependency.cell),
      code: dependency.code,
      targetVariables: dependency.targetVariables,
      resolvedVariables: dependency.resolvedVariables,
      unresolvedVariables: dependency.unresolvedVariables,
      dependencies: dependency.dependencies?.map(dependencyItemData)
    };
  }

  function cellData(cell: Cell): CellExecution.ICellData {
    return {
      modelId: cell.model.id
    };
  }
}
