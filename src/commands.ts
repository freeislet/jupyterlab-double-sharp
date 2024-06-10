import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { INotebookTracker } from '@jupyterlab/notebook';
import { fastForwardIcon } from '@jupyterlab/ui-components';

import { cellPropertiesIcon } from './icon';

export function setupCommands(
  app: JupyterFrontEnd,
  commandPalette: ICommandPalette,
  nbtracker: INotebookTracker
) {
  const { commands } = app;

  function addCommand(
    id: string,
    options: CommandRegistry.ICommandOptions,
    keyBindingOptions?: PartialPick<
      CommandRegistry.IKeyBindingOptions,
      'command'
    >
  ) {
    // Add a command
    const caption = options.caption ?? options.label;
    commands.addCommand(id, { ...options, caption });
    if (keyBindingOptions) {
      commands.addKeyBinding({ ...keyBindingOptions, command: id });
    }

    // Add the command to the command palette
    commandPalette.addItem({ command: id, category: 'Double Sharp' });
  }

  // Cell Properties
  addCommand(
    'double-sharp:cell-properties',
    {
      icon: cellPropertiesIcon,
      label: '## Cell Properties',
      execute: () => {
        // TODO
        Log.debug('## cell properties');
      }
      // isEnabled: () => nbtracker.activeCell?.model.type === 'code'
    },
    {
      keys: ['Shift 3'],
      selector: '.jp-Notebook.jp-mod-commandMode:not(.jp-mod-readWrite) :focus'
    }
  );

  // Run All Cells
  addCommand(
    'double-sharp:run-all-cells',
    {
      icon: fastForwardIcon,
      label: '## Run all cells (with cache)',
      execute: () => {
        // TODO: run all w/ cache 구현 (execution plan? context?)
        commands.execute('notebook:run-all-cells');
      }
    },
    { keys: ['Accel Shift Enter'], selector: '.jp-Notebook' }
  );
}
