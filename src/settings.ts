import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ISignal, Signal } from '@lumino/signaling';
import merge from 'lodash.merge';
import equal from 'fast-deep-equal';

export namespace Settings {
  export interface ISettings {
    execution: IExecution;
    editor: IEditor;
    enableCSMagic: boolean;
    verbose: IVerbose;
  }

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

  export interface IChangeParams<T> {
    oldValue: T;
    newValue: T;
  }
}

export class Settings {
  static readonly DEFAULT_SETTINGS: Settings.ISettings = {
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
    enableCSMagic: true,
    verbose: {
      log: false,
      metadata: false
    }
  };

  static setup(settings: ISettingRegistry.ISettings) {
    this._instance = new Settings(settings);
  }

  private static _instance?: Settings;
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

  static get verboseChanged(): ISignal<
    Settings,
    Settings.IChangeParams<Settings.IVerbose>
  > {
    return this.instance._verboseChanged;
  }

  //----

  private _settings: Settings.ISettings = Settings.DEFAULT_SETTINGS;
  private _editorChanged = new Signal<
    Settings,
    Settings.IChangeParams<Settings.IEditor>
  >(this);
  private _verboseChanged = new Signal<
    Settings,
    Settings.IChangeParams<Settings.IVerbose>
  >(this);

  constructor(settings: ISettingRegistry.ISettings) {
    this._settings = merge(this._settings, this._load(settings));

    settings.changed.connect(this.update, this);
  }

  update(settings: ISettingRegistry.ISettings) {
    // console.log(this._settings, settings.composite);

    const old = structuredClone(this._settings);
    const new_ = this._load(settings);
    this._settings = new_;

    this._emitOnChanged(old.editor, new_.editor, this._editorChanged);
    this._emitOnChanged(old.verbose, new_.verbose, this._verboseChanged);
  }

  private _load(settings: ISettingRegistry.ISettings): Settings.ISettings {
    return settings.composite as object as Settings.ISettings;
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
