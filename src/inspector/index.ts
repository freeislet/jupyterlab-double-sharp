import { ILabShell, ILayoutRestorer } from '@jupyterlab/application';
// import { INotebookTracker } from '@jupyterlab/notebook';

import { CellInspectorWidget } from './widget';
import { cellInspectorIcon } from '../icon';
import { CommandRegistration } from '../command';
import { commandIds, selectors } from '../const';

export function setupInspectors(
  labshell: ILabShell,
  restorer?: ILayoutRestorer
) {
  const commandId = commandIds.CELL_INSPECTOR;
  const widget = new CellInspectorWidget();
  widget.title.icon = cellInspectorIcon;
  widget.title.caption = '## Cell Inspector';
  widget.id = commandId;
  labshell.add(widget, 'right', {
    rank: 200,
    type: commandId
  });

  if (restorer) {
    restorer.add(widget, commandId);
  }

  // Cell Inspector command
  CommandRegistration.add(
    commandId,
    {
      icon: cellInspectorIcon,
      label: '## Cell Inspector',
      execute: () => {
        labshell.activateById(widget.id);
      }
      // isEnabled: () => nbtracker.activeCell?.model.type === 'code'
    },
    { keys: ['Shift 3'], selector: selectors.NOTEBOOK_COMMAND_MODE }
  );
}
