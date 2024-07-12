import { StreamType, MultilineString } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';

import { ICodeContext } from './code';
import { ICodeData } from '../code';
import { stringFrom } from '../utils/object';

export namespace CodeOutput {
  export interface IOptions {
    streamType: StreamType;
    overwrite: boolean;
  }
}

export class CodeOutput {
  constructor(public readonly context: ICodeContext) {}

  get outputs(): IOutputAreaModel {
    return this.context.cell.outputArea.model;
  }

  getLastIndex(): number | undefined {
    for (let i = this.outputs.length - 1; i >= 0; --i) {
      const output = this.outputs.get(i);
      if (output.type === 'stream' && output.toJSON()['_##']) {
        return i;
      }
    }
  }

  print(msg: MultilineString, options?: Partial<CodeOutput.IOptions>) {
    const streamType = options?.streamType ?? 'stdout';
    const overwrite = options?.overwrite ?? true;

    const output = {
      output_type: 'stream',
      name: streamType,
      text: msg,
      '_##': true
    };

    const overwriteIndex = overwrite ? this.getLastIndex() : undefined;
    if (overwriteIndex !== undefined) {
      this.outputs.set(overwriteIndex, output);
    } else {
      this.outputs.add(output);
    }
    // Log.debug('outputs', this.outputs.toJSON(), overwriteIndex);
  }

  printSkipped() {
    this.clearError();
    this.print('## skipped\n', { streamType: 'stderr' });
  }

  printCached(data: ICodeData) {
    this.clearError();
    this.print(`## cached: ${stringFrom(data.variables)}\n`, {
      streamType: 'stderr'
    });
  }

  clearError() {
    let numCleared = 0;

    for (let i = 0; i < this.outputs.length; ++i) {
      const output = this.outputs.get(i);
      if (
        output.type === 'error' ||
        (output.type === 'stream' && output.toJSON().name === 'stderr')
      ) {
        this.outputs.set(i, { output_type: 'null' });
        ++numCleared;
      }
    }

    if (numCleared === this.outputs.length) {
      this.outputs.clear();
    }
  }
}
