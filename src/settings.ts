import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ISignal, Signal } from '@lumino/signaling';
import merge from 'lodash.merge';
import equal from 'fast-deep-equal';

export class Settings {
  private static _instance?: Settings;

  static setup(settings: ISettingRegistry.ISettings) {
    this._instance = new Settings(settings);
  }

  static get instance(): Settings {
    if (!this._instance) throw Error('Settings instance is not initialized.');
    return this._instance;
  }

  static get settings(): Settings.ISettings {
    return this.instance._settings;
  }

  static get editorChanged(): ISignal<
    Settings,
    Settings.IChangeParams<Settings.IEditor>
  > {
    return this.instance._editorChanged;
  }

  static get toolbarChanged(): ISignal<
    Settings,
    Settings.IChangeParams<boolean>
  > {
    return this.instance._toolbarChanged;
  }

  //----

  private _settings: Settings.ISettings = Settings.DEFAULT_SETTINGS;
  private _editorChanged = new Signal<
    Settings,
    Settings.IChangeParams<Settings.IEditor>
  >(this);
  private _toolbarChanged = new Signal<
    Settings,
    Settings.IChangeParams<boolean>
  >(this);

  constructor(settings: ISettingRegistry.ISettings) {
    this._settings = merge(this._settings, Settings.load(settings));

    settings.changed.connect(this.update, this);
  }

  update(settings: ISettingRegistry.ISettings) {
    // console.log(this._settings, settings.composite);

    const old = structuredClone(this._settings);
    const new_ = Settings.load(settings);
    this._settings = new_;

    this._emitOnChanged(old.editor, new_.editor, this._editorChanged);
    this._emitOnChanged(
      old.showToolbar,
      new_.showToolbar,
      this._toolbarChanged
    );
  }

  private _emitOnChanged<T, V>(
    oldValue: V,
    newValue: V,
    signal: Signal<T, Settings.IChangeParams<V>>
  ) {
    if (newValue === undefined) return;
    if (!equal(oldValue, newValue)) {
      signal.emit({
        oldValue,
        newValue
      });
    }
  }
}

export namespace Settings {
  export interface IExecution {
    useCache: boolean;
    autoDependency: boolean;
    forceExecutionOnSingleCell: boolean;
    disableCache: boolean;
    disableAutoDependency: boolean;
    disableSkip: boolean;
  }

  export interface IEditor {
    highlight: boolean;
  }

  export interface IVerbose {
    log: boolean;
    metadata: boolean;
  }

  export interface ISettings {
    execution: IExecution;
    editor: IEditor;
    showToolbar: boolean;
    enableCSMagic: boolean;
    verbose: IVerbose;
  }

  export const DEFAULT_SETTINGS: ISettings = {
    execution: {
      useCache: true,
      autoDependency: true,
      forceExecutionOnSingleCell: true,
      disableCache: false,
      disableAutoDependency: false,
      disableSkip: false
    },
    editor: {
      highlight: true
    },
    showToolbar: true,
    enableCSMagic: true,
    verbose: {
      log: false,
      metadata: false
    }
  };

  export function load(
    settings: ISettingRegistry.ISettings
  ): Settings.ISettings {
    return settings.composite as object as Settings.ISettings;
  }

  export interface IChangeParams<T> {
    oldValue: T;
    newValue: T;
  }
}
