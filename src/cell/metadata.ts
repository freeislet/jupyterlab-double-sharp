import { CellCode } from './code';
import { MetadataGroup } from '../utils/metadata';

export namespace CellMetadata {
  // export interface ICell {
  //   subIds?: string[];
  //   parentId?: string;
  //   generated?: boolean;
  // }

  export interface IExecutionCell {
    modelId: string;
  }

  export type IExecutionDependency = {
    cell: IExecutionCell;
    dependencies?: IExecutionDependency[];
  } & Omit<CellCode.IDependency, 'context' | 'dependencies'>;

  export type IExecutionDependencyRoot = Omit<
    IExecutionDependency,
    'targetVariables' | 'resolvedVariables'
  >;

  export interface IExecution {
    skipped?: boolean;
    cached?: boolean;
    cells?: IExecutionCell[];
    dependency?: IExecutionDependencyRoot;
    outVariables?: string[];
  }
}

export class CellMetadata {
  // static get cell(): MetadataGroup<CellMetadata.ICell> {
  //   return Private.cell;
  // }

  static get execution(): MetadataGroup<CellMetadata.IExecution> {
    return Private.execution;
  }

  private constructor() {}
}

namespace Private {
  // export const cell = new MetadataGroup<CellMetadata.ICell>('##Cell', {});
  export const execution = new MetadataGroup<CellMetadata.IExecution>(
    '##Execution',
    {}
  );
}
