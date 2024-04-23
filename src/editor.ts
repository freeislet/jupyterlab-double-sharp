import {
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
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

// styles
const commentBaseTheme = EditorView.baseTheme({
  '.cm-commentLine': { backgroundColor: '#bababa1a' }
});

// line decoration
const commentDecoration = Decoration.line({
  attributes: { class: 'cm-commentLine' }
});

// view plugin
class CommentPlugin implements PluginValue {
  decorations: DecorationSet;
  firstUpdate = true; // 문서 생성 update 시 docChanged false 이슈 우회

  constructor(view: EditorView) {
    this.decorations = this.commentDeco(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || this.firstUpdate) {
      this.decorations = this.commentDeco(update.view);
      this.firstUpdate = false;
    }
  }

  commentDeco(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: node => {
          if (node.name == 'Comment') {
            builder.add(node.from, node.from, commentDecoration);
          }
        }
      });
    }
    return builder.finish();
  }
}

const commentPlugin = ViewPlugin.fromClass(CommentPlugin, {
  decorations: v => v.decorations
});

// TODO: CommentHeadingParameters
// interface EditorExtensionParameters {
//   step: number;
// }

export const editorExtensionFactory: IEditorExtensionFactory = Object.freeze({
  name: 'jupyterlab-double-sharp:comment-parser',
  factory: (options: IEditorExtensionFactory.IOptions) =>
    EditorExtensionRegistry.createImmutableExtension(
      options.model.mimeType === 'text/x-ipython' ||
        options.model.mimeType === 'text/x-python'
        ? [commentBaseTheme, commentPlugin]
        : []
    )
});

// const baseTheme = EditorView.baseTheme({
//   '&light .cm-zebraStripe': { backgroundColor: '#d4fafa' },
//   '&dark .cm-zebraStripe': { backgroundColor: '#1a2727' }
// });

// const stripeDecoration = Decoration.line({
//   attributes: { class: 'cm-zebraStripe' }
// });

// // Resolve step to use in the editor
// const stepSizeFacet = Facet.define<number, number>({
//   combine: values => (values.length ? Math.min(...values) : 2)
// });

// // plugin
// class StripePlugin implements PluginValue {
//   decorations: DecorationSet;

//   constructor(view: EditorView) {
//     this.decorations = this.stripeDeco(view);
//   }

//   update(update: ViewUpdate) {
//     // Update the stripes if the document changed,
//     // the viewport changed or the stripes step changed.
//     const oldStep = update.startState.facet(stepSizeFacet);
//     if (
//       update.docChanged ||
//       update.viewportChanged ||
//       oldStep !== update.view.state.facet(stepSizeFacet)
//     ) {
//       this.decorations = this.stripeDeco(update.view);
//     }
//   }

//   // Create the range of lines requiring decorations
//   stripeDeco(view: EditorView) {
//     const step = view.state.facet(stepSizeFacet) as number;
//     const builder = new RangeSetBuilder<Decoration>();
//     for (const { from, to } of view.visibleRanges) {
//       for (let pos = from; pos <= to; ) {
//         const line = view.state.doc.lineAt(pos);
//         if (line.number % step === 0) {
//           builder.add(line.from, line.from, stripeDecoration);
//         }
//         pos = line.to + 1;
//       }
//     }
//     return builder.finish();
//   }
// }

// const stripePlugin = ViewPlugin.fromClass(StripePlugin, {
//   decorations: v => v.decorations
// });

// // Full extension composed of elemental extensions
// export function editorExtension(options: { step?: number } = {}): Extension {
//   return [
//     baseTheme,
//     typeof options.step !== 'number' ? [] : stepSizeFacet.of(options.step),
//     stripePlugin
//   ];
// }

// export const editorExtensionFactory: IEditorExtensionFactory<number> =
//   Object.freeze({
//     name: 'jupyterlab-double-sharp:zebra-stripes',
//     // Default CodeMirror extension parameters
//     default: 2,
//     factory: (options: IEditorExtensionFactory.IOptions) =>
//       // The factory will be called for every new CodeMirror editor
//       EditorExtensionRegistry.createConfigurableExtension((step: number) =>
//         editorExtension({ step })
//       ),
//     // JSON schema defining the CodeMirror extension parameters
//     // - 참고: https://github.com/jupyterlab/jupyterlab/blob/2ceabd8c7b98e7b2c305be406ade799f387a90eb/packages/codemirror/src/extension.ts#L971
//     schema: {
//       type: 'number',
//       title: 'Show stripes',
//       description: 'Display zebra stripes every "step" in CodeMirror editors.'
//     }
//   });
