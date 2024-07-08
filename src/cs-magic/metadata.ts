import { MetadataGroupDirtyable } from '../utils/metadata';

export interface ICSMagicData {
  skip?: boolean;
  cache?: boolean;
}

export type CSMagicMetadata = MetadataGroupDirtyable<ICSMagicData>;
