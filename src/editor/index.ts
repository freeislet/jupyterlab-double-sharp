import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  IEditorExtensionRegistry,
  EditorExtensionRegistry,
  IEditorExtensionFactory,
  IConfigurableExtension
} from '@jupyterlab/codemirror';
import { getCommentExtension, ICommentParameters } from './comment';

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

type IEditorExtensionParameters = ICommentParameters & {};

function createConfigurableExtension(
  options: IEditorExtensionFactory.IOptions
): IConfigurableExtension<IEditorExtensionParameters> | null {
  const valid = options.model.mimeType === 'text/x-ipython';
  if (!valid) return null;

  return EditorExtensionRegistry.createConfigurableExtension(
    (params: IEditorExtensionParameters) => getCommentExtension(params)
  );
}

export const setupEditorExtension = (
  registry: IEditorExtensionRegistry,
  settings: ISettingRegistry.ISettings
) => {
  const factory: IEditorExtensionFactory<IEditorExtensionParameters> =
    Object.freeze({
      name: 'jupyterlab-double-sharp:editor',
      default: { highlight: true },
      factory: createConfigurableExtension,
      schema
    });

  registry.addExtension(factory);
};
