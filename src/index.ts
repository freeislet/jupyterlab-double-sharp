import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookTracker } from '@jupyterlab/notebook';
// import { ICommandPalette } from '@jupyterlab/apputils';
// import { Widget } from '@lumino/widgets';
import { markdownIcon, runIcon } from '@jupyterlab/ui-components';

const CommandIds = {
  /**
   * Command to render a markdown cell.
   */
  renderMarkdownCell: 'toolbar-button:render-markdown-cell',
  /**
   * Command to run a code cell.
   */
  runCodeCell: 'toolbar-button:run-code-cell'
};

/**
 * Activate the extension.
 */
function activate(
  app: JupyterFrontEnd,
  tracker: INotebookTracker,
  settingRegistry: ISettingRegistry | null
) {
  console.log('JupyterLab extension jupyterlab-double-sharp is activated!');

  if (settingRegistry) {
    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log(
          'jupyterlab-double-sharp settings loaded:',
          settings.composite
        );
      })
      .catch(reason => {
        console.error(
          'Failed to load settings for jupyterlab-double-sharp.',
          reason
        );
      });
  }

  const { commands } = app;

  /* Adds a command enabled only on code cell */
  commands.addCommand(CommandIds.runCodeCell, {
    icon: runIcon,
    caption: 'Run a code cell',
    execute: () => {
      commands.execute('notebook:run-cell');
    },
    isVisible: () => tracker.activeCell?.model.type === 'code'
  });

  /* Adds a command enabled only on markdown cell */
  commands.addCommand(CommandIds.renderMarkdownCell, {
    icon: markdownIcon,
    caption: 'Render a markdown cell',
    execute: () => {
      commands.execute('notebook:run-cell');
    },
    isVisible: () => tracker.activeCell?.model.type === 'markdown'
  });
}

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp:plugin',
  description: 'Convert comments starting with ## to Markdown',
  autoStart: true,
  requires: [INotebookTracker], //[ICommandPalette],
  optional: [ISettingRegistry],
  activate
};

export default plugin;
