import { ILabShell, ILayoutRestorer } from '@jupyterlab/application';
// import { INotebookTracker } from '@jupyterlab/notebook';

import { CellInspectorWidget } from './widget';
import { cellPropertiesIcon } from '../icon';
import { CommandRegistration } from '../command';

export function setupInspectors(
  labshell: ILabShell,
  restorer?: ILayoutRestorer
) {
  const widget = new CellInspectorWidget();
  widget.title.icon = cellPropertiesIcon;
  widget.title.caption = '## Cell Properties';
  widget.id = 'double-sharp:cell-properties';
  labshell.add(widget, 'right', {
    rank: 200,
    type: 'double-sharp:cell-properties'
  });

  if (restorer) {
    restorer.add(widget, 'double-sharp:cell-properties');
  }

  // Cell Properties command
  CommandRegistration.add(
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
}
