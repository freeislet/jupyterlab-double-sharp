import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  IEditorExtensionRegistry,
  EditorExtensionRegistry,
  IEditorExtensionFactory
} from '@jupyterlab/codemirror';
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
// import { Extension, Facet, RangeSetBuilder } from '@codemirror/state';
import { Facet, RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { SyntaxNodeRef } from '@lezer/common';

// styles
const commentBaseTheme = EditorView.baseTheme({
  '.cm-commentLine': { backgroundColor: '#aaa2' },
  '.cm-commentLine > span': { color: '#55f' }
});

// line decoration
const commentDecoration = Decoration.line({
  attributes: { class: 'cm-commentLine' }
});

// facet
const facets = {
  highlight: Facet.define<boolean, boolean>({
    combine: values => (values.length ? values[values.length - 1] : false)
  })
};

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
      update.startState.facet(facets.highlight) !==
        update.view.state.facet(facets.highlight)
    ) {
      this.decorations = this.commentDeco(update.view);
    }
  }

  commentDeco(view: EditorView): DecorationSet {
    const test = view.state.facet(facets.highlight);
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

interface ICommentParameters {
  highlight: boolean;
}

export const setupEditorExtension = (
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) => {
  const factory: IEditorExtensionFactory<ICommentParameters> = Object.freeze({
    name: 'jupyterlab-double-sharp:editor-comment',
    default: { highlight: true },
    factory(options: IEditorExtensionFactory.IOptions) {
      const valid = options.model.mimeType === 'text/x-ipython';
      return EditorExtensionRegistry.createConfigurableExtension(
        (params: ICommentParameters) =>
          valid
            ? [
                facets.highlight.of(params.highlight),
                commentBaseTheme,
                commentPlugin
              ]
            : []
      );
    },
    schema: {
      title: 'Double Sharp Editor Options',
      type: 'object',
      properties: {
        highlight: {
          title: 'Highlight ## lines',
          type: 'boolean'
          // description: '...'
        }
      }
    }
  });

  registry.addExtension(factory);
};
