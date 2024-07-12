import { Cell } from '@jupyterlab/cells';

import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { ICodeExecution, IDependency } from '../execution';

export namespace CellExecution {
  /**
   * ICodeExecution metadata (##Execution)
   */
  export type IData = {
    cell?: ICellData;
    dependencies?: IDependencyData[];
    dependentCells?: ICellData[];
  } & Partial<Omit<ICodeExecution, 'cell' | 'dependencies' | 'dependentCells'>>;

  export type IDependencyData = {
    cell: ICellData;
    dependencies?: IDependencyData[];
  } & Omit<IDependency, 'cell' | 'dependencies'>;

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
      config: execution.config,
      skipped: execution.skipped,
      cached: execution.cached,
      code: execution.code,
      unresolvedVariables: execution.unresolvedVariables,
      dependencies: execution.dependencies?.map(dependencyData),
      dependentCells: execution.dependentCells?.map(cellData)
    };
  }

  function dependencyData(
    dependency: IDependency
  ): CellExecution.IDependencyData {
    return {
      cell: cellData(dependency.cell),
      code: dependency.code,
      targetVariables: dependency.targetVariables,
      resolvedVariables: dependency.resolvedVariables,
      unresolvedVariables: dependency.unresolvedVariables,
      dependencies: dependency.dependencies?.map(dependencyData)
    };
  }

  function cellData(cell: Cell): CellExecution.ICellData {
    return {
      modelId: cell.model.id
    };
  }
}
