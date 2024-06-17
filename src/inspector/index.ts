import { ILabShell, ILayoutRestorer } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

import { InspectorWidget } from './widget';
import { inspectorIcon } from '../icon';
import { App } from '../app';
import { commandIds, selectors } from '../const';

export function setupInspectors(
  nbtracker: INotebookTracker,
  labshell: ILabShell,
  restorer?: ILayoutRestorer
) {
  const commandId = commandIds.INSPECTOR;
  const widget = new InspectorWidget(nbtracker);
  widget.title.icon = inspectorIcon;
  widget.title.caption = '## Inspector';
  widget.id = commandId;
  labshell.add(widget, 'right', {
    rank: 200,
    type: commandId
  });

  if (restorer) {
    restorer.add(widget, commandId);
  }

  // Inspector command
  App.instance.addCommand(
    commandId,
    {
      icon: inspectorIcon,
      label: '## Inspector',
      execute: () => {
        labshell.activateById(widget.id);
      }
      // isEnabled: () => nbtracker.activeCell?.model.type === 'code'
    },
    { keys: ['Shift 3'], selector: selectors.NOTEBOOK_COMMAND_MODE }
  );
}
