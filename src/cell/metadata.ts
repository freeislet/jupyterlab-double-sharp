import { MetadataGroup, MetadataGroupDirtyable } from '../utils/metadata';
import { ICodeVariables } from '../code';

export namespace CellMetadata {
  export interface ICell {
    subIds?: string[];
    parentId?: string;
    generated?: boolean;
  }

  export interface IConfig {
    skip: boolean;
    cache?: boolean;
  }

  export type IConfigOverride = Partial<IConfig>;

  export type ICode = ICodeVariables;

  // export interface IExecution {
  //   skip: boolean;
  //   skipMessage?: string;
  //   cache: boolean;
  //   // dependencies?: string[]; // TODO
  // }
}

export class CellMetadata {
  static get Cell(): MetadataGroup<CellMetadata.ICell> {
    return Private.Cell;
  }

  static get Config(): MetadataGroup<CellMetadata.IConfig> {
    return Private.Config;
  }

  static get ConfigOverride(): MetadataGroupDirtyable<CellMetadata.IConfigOverride> {
    return Private.ConfigOverride;
  }

  static get Code(): MetadataGroupDirtyable<CellMetadata.ICode> {
    return Private.Code;
  }

  // static get Execution(): MetadataGroup<CellMetadata.IExecution> {
  //   return Private.Execution;
  // }

  private constructor() {}
}

namespace Private {
  export const Cell = new MetadataGroup<CellMetadata.ICell>('##Cell', {});
  export const Config = new MetadataGroup<CellMetadata.IConfig>('##Config', {
    skip: false
  });
  export const ConfigOverride =
    new MetadataGroupDirtyable<CellMetadata.IConfigOverride>(
      '##ConfigOverride',
      '##ConfigOverride-dirty',
      {}
    );
  export const Code = new MetadataGroupDirtyable<CellMetadata.ICode>(
    '##Code',
    '##Code-dirty',
    {
      variables: [],
      unboundVariables: []
    }
  );
  // export const Execution = new MetadataGroup<CellMetadata.IExecution>(
  //   '##Execution',
  //   {
  //     skip: false,
  //     cache: false
  //   }
  // );
}
