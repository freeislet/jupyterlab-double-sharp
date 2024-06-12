import * as React from 'react';
import { ICellModel } from '@jupyterlab/cells';
import { settingsIcon } from '@jupyterlab/ui-components';

import { CellContext } from '../cell';
import { App } from '../app';

interface IContextProps {
  context: CellContext;
}

export interface ICellToolsProps extends IContextProps {}

export default function CellTools({ context }: ICellToolsProps) {
  return (
    <>
      <Header>## Cell Inspector</Header>
      <Content>
        <Model model={context.cell.model} />
      </Content>
    </>
  );
}

interface IChildrenProps {
  children?: React.ReactNode;
}

function Header({ children }: IChildrenProps) {
  const openSettings = () =>
    App.instance.commands.execute('settingeditor:open', {
      query: 'Double Sharp'
    });

  return (
    <div className="jp-DoubleSharp-CellInspector-Header">
      <div className="jp-DoubleSharp-CellInspector-Header-title">
        {children}
      </div>
      <div className="jp-DoubleSharp-CellInspector-Header-toolbar">
        <button
          title="Double Sharp settings"
          className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
          onClick={openSettings}
        >
          <settingsIcon.react />
        </button>
      </div>
    </div>
  );
}

function Content({ children }: IChildrenProps) {
  return <div className="jp-DoubleSharp-CellInspector-Content">{children}</div>;
}

interface IModelProps {
  model: ICellModel;
}

function Model({ model }: IModelProps) {
  return (
    <fieldset>
      <legend>Model</legend>
      <p>{model.id}</p>
    </fieldset>
  );
}
