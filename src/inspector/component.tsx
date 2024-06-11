import * as React from 'react';

import { CellContext } from '../cell';

export interface ICellToolsProps {
  context: CellContext;
}

export default function CellTools({ context }: ICellToolsProps) {
  return (
    <>
      <div>My Widget</div>
      <span>{context.cell.model.id}</span>
    </>
  );
}
