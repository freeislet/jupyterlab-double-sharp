import { MetadataGroupDirtyable } from '../utils/metadata';
import { metadataKeys } from '../const';

export namespace CSMagicCell {
  export interface IData {
    skip?: boolean;
    cache?: boolean;
  }
}
export class CSMagicCell {
  private static _metadata = new MetadataGroupDirtyable<CSMagicCell.IData>(
    metadataKeys.csmagic,
    {}
  );

  static get metadata(): MetadataGroupDirtyable<CSMagicCell.IData> {
    return CSMagicCell._metadata;
  }
}
