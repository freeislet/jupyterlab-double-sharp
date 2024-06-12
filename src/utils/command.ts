import { CommandRegistry } from '@lumino/commands';
import { ICommandPalette, IPaletteItem } from '@jupyterlab/apputils';

/**
 * Add a command
 */
export function addCommand(
  registry: CommandRegistry,
  id: string,
  options: CommandRegistry.ICommandOptions,
  keyBindingOptions?: PartialPick<CommandRegistry.IKeyBindingOptions, 'command'>
) {
  registry.addCommand(id, { caption: options.label, ...options });

  if (keyBindingOptions) {
    registry.addKeyBinding({ command: id, ...keyBindingOptions });
  }
}

/**
 * Add the command to the command palette
 */
export function addCommandPalette(
  palette: ICommandPalette,
  options: PartialPick<IPaletteItem, 'category'>
) {
  palette.addItem({ category: 'Double Sharp', ...options });
}
