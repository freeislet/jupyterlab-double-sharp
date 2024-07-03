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

import { ConfigFacet } from '../utils/editor';
import { Settings } from '../settings';

const FACTORY_NAME = 'jupyterlab-double-sharp:editor-highlight';

// styles
const highlightTheme = EditorView.baseTheme({
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
class HighlightPlugin implements PluginValue {
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
      // TODO: topLevel = node.parent?.parent !이면 return false -> 함수 안 주석 확인
    }

    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({ enter, from, to });
    }
    return builder.finish();
  }
}

const highlightPlugin = ViewPlugin.fromClass(HighlightPlugin, {
  decorations: v => v.decorations
});

// settings

function applySettings(
  registry: IEditorExtensionRegistry,
  editorSettings: Settings.IEditor
) {
  console.log('editor settings:', editorSettings);

  const handlers = (registry as EditorExtensionRegistry)['handlers'];
  for (const handler of handlers) {
    handler.setOption(FACTORY_NAME, editorSettings);
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

// interface IHighlightParams {
//   highlight?: boolean;
// }
type IHighlightParams = Settings.IEditor;

function createEditorExtension(
  options: IEditorExtensionFactory.IOptions
): IConfigurableExtension<IHighlightParams> | null {
  const valid = options.model.mimeType === 'text/x-ipython';
  if (!valid) return null;

  return EditorExtensionRegistry.createConfigurableExtension(
    (params: IHighlightParams) => [
      // highlightConfig.instance(params.highlight ?? false),
      // NOTE: extension과 연결된 EditorView를 참조할 수 없어서 그냥 facet 사용 (단, schema 등록 X)
      // TODO: 전체 EditorView 참조 방식 검토 (NotebookCellActions.forAllCells 같은 방식?)
      highlightConfig.facet.of(params.highlight ?? false),
      highlightTheme,
      highlightPlugin
    ]
  );
}

const factory: IEditorExtensionFactory<IHighlightParams> = Object.freeze({
  name: FACTORY_NAME,
  factory: createEditorExtension,
  default: { highlight: true }
  // schema // NOTE: CodeMirror 세팅 화면이 아닌 Double Sharp 세팅에 표시하기 위해 schema 주석 처리
});

export function setupHighlightExtension(registry: IEditorExtensionRegistry) {
  // applySettings(Settings.settings.editor, registry);

  Settings.editorChanged.connect(
    (settings: Settings, change: Settings.IChangeParams<Settings.IEditor>) => {
      applySettings(registry, change.newValue);
    }
  );

  registry.addExtension(factory);
}
