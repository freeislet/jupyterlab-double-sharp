import {
  IEditorExtensionRegistry,
  EditorExtensionRegistry,
  IEditorExtensionFactory,
  IConfigurableExtension
} from '@jupyterlab/codemirror';
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { SyntaxNodeRef } from '@lezer/common';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  INotebookTracker,
  NotebookActions,
  Notebook
} from '@jupyterlab/notebook';
import {
  ICellModel /*, CodeCellModel, isCodeCellModel*/
} from '@jupyterlab/cells';

import { ConfigFacet } from './utils';

const FACTORY_NAME = 'jupyterlab-double-sharp:editor-comment';

// styles
const commentBaseTheme = EditorView.baseTheme({
  '.cm-commentLine': { backgroundColor: '#aaa3' },
  '.cm-commentLine > span': { color: 'var(--jp-info-color1)' }
});

// line decoration
const commentDecoration = Decoration.line({
  attributes: { class: 'cm-commentLine' }
});

// config (facet + compartment)
const highlightConfig = ConfigFacet.defineCombined(false);

// view plugin
class CommentPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.commentDeco(view);
  }

  update(update: ViewUpdate) {
    if (
      update.docChanged ||
      update.viewportChanged ||
      syntaxTree(update.startState) !== syntaxTree(update.state) ||
      update.startState.facet(highlightConfig.facet) !==
        update.view.state.facet(highlightConfig.facet)
    ) {
      this.decorations = this.commentDeco(update.view);
    }
  }

  commentDeco(view: EditorView): DecorationSet {
    const test = view.state.facet(highlightConfig.facet);
    if (!test) return Decoration.none;

    function enter(node: SyntaxNodeRef): boolean | void {
      if (node.name === 'Comment') {
        const comment = view.state.doc.sliceString(node.from, node.to);
        const isExt = comment.startsWith('##');
        if (isExt) {
          const deco = commentDecoration;
          builder.add(node.from, node.from, deco);
        }
      }
    }

    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({ enter, from, to });
    }
    return builder.finish();
  }
}

const commentPlugin = ViewPlugin.fromClass(CommentPlugin, {
  decorations: v => v.decorations
});

// settings

function loadAndApplySettings(
  settings: ISettingRegistry.ISettings,
  registry: IEditorExtensionRegistry
) {
  // Read the settings and convert to the correct type
  const limit = settings.get('limit').composite as number;
  const flag = settings.get('flag').composite as boolean;

  console.log(
    `Settings Example extension: Limit is set to '${limit}' and flag to '${flag}'`
  );

  const editor = settings.get('editor').composite as object;
  const handlers = (registry as EditorExtensionRegistry)['handlers'];
  for (const handler of handlers) {
    handler.setOption(FACTORY_NAME, editor);
  }
  // console.log('registry.baseConfiguration', registry.baseConfiguration);
  // (registry as EditorExtensionRegistry).baseConfiguration = {
  //   FACTORY_NAME: editor
  // };
}

// extension

// NOTE: CodeMirror 세팅 화면이 아닌 Double Sharp 세팅에 표시하기 위해 plugin.json에 추가
// const schema = {
//   title: 'Double Sharp Editor Options',
//   type: 'object',
//   properties: {
//     highlight: {
//       title: 'Highlight ## lines',
//       type: 'boolean'
//       // description: '...'
//     }
//   }
// };

interface ICommentParameters {
  highlight?: boolean;
}

function createEditorExtension(
  options: IEditorExtensionFactory.IOptions
): IConfigurableExtension<ICommentParameters> | null {
  const valid = options.model.mimeType === 'text/x-ipython';
  if (!valid) return null;

  return EditorExtensionRegistry.createConfigurableExtension(
    (params: ICommentParameters) => [
      // highlightConfig.instance(params.highlight ?? false),
      // NOTE: extension과 연결된 EditorView를 참조할 수 없어서 그냥 facet 사용 (단, schema 등록 X)
      highlightConfig.facet.of(params.highlight ?? false),
      commentBaseTheme,
      commentPlugin
    ]
  );
}

const factory: IEditorExtensionFactory<ICommentParameters> = Object.freeze({
  name: FACTORY_NAME,
  factory: createEditorExtension,
  default: { highlight: true }
  // schema // NOTE: CodeMirror 세팅 화면이 아닌 Double Sharp 세팅에 표시하기 위해 schema 주석 처리
});

export function setupCommentExtension(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings,
  notebookTracker: INotebookTracker
) {
  function updateSettings(settings: ISettingRegistry.ISettings) {
    loadAndApplySettings(settings, registry);
  }

  updateSettings(settings);
  settings.changed.connect(updateSettings);

  registry.addExtension(factory);

  // signal test
  // - 참고: https://stackoverflow.com/questions/69657393/how-to-use-events-in-jupyterlab-extensions
  NotebookActions.executionScheduled.connect((sender, args) => {
    console.log('executionScheduled', sender, args);
  });
  NotebookActions.executed.connect((sender, args) => {
    console.log('executed', sender, args);
  });
  notebookTracker.activeCellChanged.connect((sender, cell) => {
    console.log('activeCellChanged', sender, cell);

    if (!cell) return;

    console.log(cell.model.sharedModel.getSource());

    cell.model.contentChanged.connect(cellModel =>
      __cellContentChanged(cellModel, notebookTracker.currentWidget?.content)
    );
    // cell.model.stateChanged.connect(__cellStateChanged);
  });

  function __cellContentChanged(cellModel: ICellModel, notebook?: Notebook) {
    let id = cellModel.id;
    console.log('Content of cell ' + id + ' changed');
    console.log(cellModel, notebook);
    console.log(cellModel.sharedModel.getSource());
  }
  // function __cellStateChanged(cellModel: ICellModel, change: any) {
  //   console.log('State of cell ' + cellModel.id + ' changed:');
  //   console.log('name: ' + change.name);
  //   console.log('old value: ' + change.oldValue);
  //   console.log('new value: ' + change.newValue);
  //   console.log(cellModel, change);
  // }
}
