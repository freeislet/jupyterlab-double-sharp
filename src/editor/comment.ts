import { ISettingRegistry } from '@jupyterlab/settingregistry';
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

import { ConfigFacet } from './utils';

// styles
const commentBaseTheme = EditorView.baseTheme({
  '.cm-commentLine': { backgroundColor: '#aaa2' },
  '.cm-commentLine > span': { color: '#55f' }
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

// extension

const schema = {
  title: 'Double Sharp Editor Options',
  type: 'object',
  properties: {
    highlight: {
      title: 'Highlight ## lines',
      type: 'boolean'
      // description: '...'
    }
  }
};

interface ICommentParameters {
  highlight?: boolean;
}

function createEditorExtension(
  options: IEditorExtensionFactory.IOptions
): IConfigurableExtension<ICommentParameters> | null {
  const valid = options.model.mimeType === 'text/x-ipython';
  if (!valid) return null;

  return EditorExtensionRegistry.createConfigurableExtension(
    (params: ICommentParameters) => {
      console.log('comment params:', params);
      console.trace();
      return [
        // highlightConfig.facet.of(params.highlight ?? false),
        highlightConfig.instance(params.highlight ?? false),
        commentBaseTheme,
        commentPlugin
      ];
    }
  );
}

const factory: IEditorExtensionFactory<ICommentParameters> = Object.freeze({
  name: 'jupyterlab-double-sharp:editor-comment',
  factory: createEditorExtension,
  default: { highlight: true },
  schema
});

export function setupCommentExtension(
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) {
  loadSettings(settings);
  settings.changed.connect(loadSettings);

  registry.addExtension(factory);
}

// settings

function loadSettings(settings: ISettingRegistry.ISettings): void {
  // Read the settings and convert to the correct type
  const limit = settings.get('limit').composite as number;
  const flag = settings.get('flag').composite as boolean;

  console.log(
    `Settings Example extension: Limit is set to '${limit}' and flag to '${flag}'`
  );
}
