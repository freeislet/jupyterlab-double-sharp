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

/**
 * Command 등록 helper class
 */
export class CommandRegistration {
  private static _current: CommandRegistration | null = null;
  static get current(): CommandRegistration | null {
    return this._current;
  }

  static begin(registry: CommandRegistry, palette: ICommandPalette) {
    this._current = new CommandRegistration(registry, palette);
  }

  static end() {
    this._current = null;
  }

  static add(
    id: string,
    options: CommandRegistry.ICommandOptions,
    keyBindingOptions?: PartialPick<
      CommandRegistry.IKeyBindingOptions,
      'command'
    >
  ) {
    if (!this.current) throw Error('CommandRegistration is not begun.');
    this.current.add(id, options, keyBindingOptions);
  }

  constructor(
    public readonly registry: CommandRegistry,
    public readonly palette: ICommandPalette
  ) {}

  add(
    id: string,
    options: CommandRegistry.ICommandOptions,
    keyBindingOptions?: PartialPick<
      CommandRegistry.IKeyBindingOptions,
      'command'
    >
  ) {
    addCommand(this.registry, id, options, keyBindingOptions);
    addCommandPalette(this.palette, { command: id });
  }
}
