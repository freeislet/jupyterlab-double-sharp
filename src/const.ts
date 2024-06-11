export const PLUGIN_ID = 'jupyterlab-double-sharp:plugin';

export const commandIds = {
  CELL_INSPECTOR: 'double-sharp:cell-inspector',
  RUN_ALL_CELLS: 'double-sharp:run-all-cells'
};

export const selectors = {
  NOTEBOOK: '.jp-Notebook',
  NOTEBOOK_COMMAND_MODE:
    '.jp-Notebook.jp-mod-commandMode:not(.jp-mod-readWrite) :focus'
};
