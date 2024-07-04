import {
  IEditorExtensionRegistry,
  EditorExtensionRegistry,
  IEditorExtensionFactory,
  IConfigurableExtension,
  CodeMirrorEditor
} from '@jupyterlab/codemirror';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Cell } from '@jupyterlab/cells';
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
import { CellActions } from '../cell';
import { isTopLevelCommentNode, isStatementComment } from '../utils/statement';

const FACTORY_NAME = 'jupyterlab-double-sharp:editor-highlight';

// styles
const highlightTheme = EditorView.baseTheme({
  '.cm-commentLine': { backgroundColor: 'var(--jp-statement-bg-color)' },
  '.cm-commentLine > span': { color: 'var(--jp-statement-color)' }
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
    const enabled = view.state.facet(highlightConfig.facet);
    if (!enabled) return Decoration.none;

    function enter(node: SyntaxNodeRef): boolean | void {
      if (isTopLevelCommentNode(node)) {
        const comment = view.state.doc.sliceString(node.from, node.to);
        if (isStatementComment(comment)) {
          const deco = commentDecoration;
          builder.add(node.from, node.from, deco);
          // Log.debug('## Comment', node, node.node);
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

const highlightPlugin = ViewPlugin.fromClass(HighlightPlugin, {
  decorations: v => v.decorations
});

// 셀 editor에 extension 적용 여부 filter

function filterEditor(model: CodeEditor.IModel | null | undefined): boolean {
  return model?.mimeType === 'text/x-ipython';
}

// settings

function applySettings(editorSettings: Settings.IEditor) {
  // Log.debug('editor settings:', editorSettings);

  CellActions.forAllCells(
    (cell: Cell) => {
      const view = (cell.editor as CodeMirrorEditor).editor;
      highlightConfig.apply(view, editorSettings.highlight);
    },
    (cell: Cell) => filterEditor(cell.editor?.model)
  );
}

// extension

export function setupHighlightExtension(registry: IEditorExtensionRegistry) {
  // NOTE: reconfigure를 직접 처리하므로 T = undefined
  const factory: IEditorExtensionFactory<undefined> = Object.freeze({
    name: FACTORY_NAME,
    factory: (
      options: IEditorExtensionFactory.IOptions
    ): IConfigurableExtension<undefined> | null => {
      if (!filterEditor(options.model)) return null;

      // NOTE: reconfigure를 직접 처리하므로 createConfigurableExtension 대신
      //       createImmutableExtension 사용
      return EditorExtensionRegistry.createImmutableExtension([
        highlightConfig.instance(Settings.data.editor.highlight),
        highlightTheme,
        highlightPlugin
      ]);
    }
    // NOTE: editor 관련 세팅을 CodeMirror 세팅이 아닌 Double Sharp 세팅에 표시하므로,
    //       schema, default 속성 사용하지 않음 (schema는 plugin.json에 정의)
  });
  registry.addExtension(factory);

  Settings.editorChanged.connect(
    (settings: Settings, change: Settings.IChangeParams<Settings.IEditor>) => {
      applySettings(change.newValue);
    }
  );
  // applySettings(Settings.data.editor);
}
