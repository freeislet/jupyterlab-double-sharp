import { LabIcon } from '@jupyterlab/ui-components';

import doubleSharpSvg from '../style/icons/double-sharp.svg';
import cellInspectorSvg from '../style/icons/cell-inspector.svg';

export const doubleSharpIcon = new LabIcon({
  name: 'double-sharp:icon',
  svgstr: doubleSharpSvg
});

export const cellInspectorIcon = new LabIcon({
  name: 'double-sharp:cell-inspector:icon',
  svgstr: cellInspectorSvg
});
