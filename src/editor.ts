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
const testFacet = Facet.define<boolean, boolean>({
  combine: values => (values.length ? values[values.length - 1] : false)
});

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
      syntaxTree(update.startState) != syntaxTree(update.state) ||
      update.startState.facet(testFacet) !== update.view.state.facet(testFacet)
    ) {
      this.decorations = this.commentDeco(update.view);
    }
  }

  commentDeco(view: EditorView): DecorationSet {
    const test = view.state.facet(testFacet);
    if (!test) return Decoration.none;

    function enter(node: SyntaxNodeRef): boolean | void {
      if (node.name == 'Comment') {
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

interface CommentParameters {
  test: boolean;
}

export const setupEditorExtension = (
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) => {
  const factory: IEditorExtensionFactory<CommentParameters> = Object.freeze({
    name: 'jupyterlab-double-sharp:editor-comment',
    default: { test: true },
    factory(options: IEditorExtensionFactory.IOptions) {
      const valid = options.model.mimeType === 'text/x-ipython';
      return EditorExtensionRegistry.createConfigurableExtension(
        (params: CommentParameters) =>
          valid
            ? [testFacet.of(params.test), commentBaseTheme, commentPlugin]
            : []
      );
    },
    schema: {
      title: 'Double Sharp Editor Options',
      type: 'object',
      properties: {
        test: {
          title: 'test',
          type: 'boolean',
          description:
            'Display zebra stripes every "step" in CodeMirror editors.'
        }
      }
    }
  });

  registry.addExtension(factory);
};

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
