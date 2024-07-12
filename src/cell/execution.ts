import { Cell } from '@jupyterlab/cells';

import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { IExecutionPlan, IDependency } from '../execution';

export namespace CellExecution {
  /**
   * IExecutionPlan metadata (##Execution)
   */
  export type IData = {
    cell?: ICellData;
    dependencies?: IDependencyData[];
    dependentCells?: ICellData[];
  } & Partial<Omit<IExecutionPlan, 'cell' | 'dependencies' | 'dependentCells'>>;

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
  export function saveMetadata(plan: IExecutionPlan) {
    const metadata = planData(plan);
    CellExecution.metadata.set(plan.cell.model, metadata);
  }

  function planData(plan: IExecutionPlan): CellExecution.IData {
    return {
      cell: cellData(plan.cell),
      config: plan.config,
      skipped: plan.skipped,
      cached: plan.cached,
      code: plan.code,
      unresolvedVariables: plan.unresolvedVariables,
      dependencies: plan.dependencies?.map(dependencyData),
      dependentCells: plan.dependentCells?.map(cellData)
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
