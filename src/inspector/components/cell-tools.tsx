import * as React from 'react';
// import { ICellModel } from '@jupyterlab/cells';
import { settingsIcon } from '@jupyterlab/ui-components';

import { CellContext, CellMetadata, CellConfig } from '../../cell';
import { App } from '../../app';
import { IChildrenProps } from '../../ui';
import ToolbarButton from '../../ui/toolbar-button';
import Group from '../../ui/group';
import Checkbox from '../../ui/checkbox';

export interface ICellToolsProps {
  context: CellContext | null;
}

export default function CellTools({ context }: ICellToolsProps) {
  if (context) {
    return (
      <>
        <Header>## Cell Inspector</Header>
        <Content>
          <Config context={context} />
        </Content>
      </>
    );
  } else {
    return (
      <div className="jp-DoubleSharp-CellInspector-placeholder">
        No cell is selected.
      </div>
    );
  }
}

function Header({ children }: IChildrenProps) {
  return (
    <div className="jp-DoubleSharp-CellInspector-Header">
      <div className="jp-DoubleSharp-CellInspector-Header-title">
        {children}
      </div>
      <div className="jp-DoubleSharp-CellInspector-Header-toolbar">
        <ToolbarButton
          title="Double Sharp settings"
          onClick={() => App.instance.openSettings()}
        >
          <settingsIcon.react />
        </ToolbarButton>
      </div>
    </div>
  );
}

function Content({ children }: IChildrenProps) {
  return <div className="jp-DoubleSharp-CellInspector-Content">{children}</div>;
}

interface IContextProps {
  context: CellContext;
}

function Config({ context }: IContextProps) {
  const model = context.cell.model;
  const config = CellMetadata.config.getCoalesced(model);
  const checked = config.useCache ?? false; // TODO: useSettings UI
  const onChangeUseCache = (checked: boolean) =>
    CellMetadata.config.update(model, { useCache: checked });
  const finalConfig = CellConfig.get(context.cell.model);
  finalConfig;

  return (
    <Group>
      <Group.Title>Config</Group.Title>
      <ConfigCheckItem checked={checked} onChange={onChangeUseCache}>
        Use Cache
      </ConfigCheckItem>
      {context.cell.model.id}
    </Group>
  );
}

interface IConfigCheckProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

function ConfigCheckItem({ checked, onChange, children }: IConfigCheckProps) {
  return (
    <Checkbox
      className="jp-DoubleSharp-CellInspector-ConfigItem"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    >
      {children}
    </Checkbox>
  );
}

// interface IModelProps {
//   model: ICellModel;
// }

// function Model({ model }: IModelProps) {
//   return (
//     <fieldset>
//       <legend>Model</legend>
//       <p>{model.id}</p>
//     </fieldset>
//   );
// }
