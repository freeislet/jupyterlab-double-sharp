import { CSMagicExecutor } from './executor';
import * as Commands from './commands';

export class CSMagic {
  static readonly executor = new CSMagicExecutor([
    new Commands.SkipCommand(),
    new Commands.CacheCommand()
  ]);
}

export { CSMagicExecutor };
export { ICSMagicData } from './metadata';
