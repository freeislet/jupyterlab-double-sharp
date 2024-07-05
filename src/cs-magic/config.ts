import { MetadataGroupDirtyable } from '../utils/metadata';
import { metadataKeys } from '../const';

export namespace CSMagicConfig {
  export interface IData {
    skip?: boolean;
    cache?: boolean;
  }
}
export class CSMagicConfig {
  private static _metadata = new MetadataGroupDirtyable<CSMagicConfig.IData>(
    metadataKeys.csmagic,
    {}
  );

  static get metadata(): MetadataGroupDirtyable<CSMagicConfig.IData> {
    return CSMagicConfig._metadata;
  }
}
