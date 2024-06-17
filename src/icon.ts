import { LabIcon } from '@jupyterlab/ui-components';

import doubleSharpSvg from '../style/icons/double-sharp.svg';
import inspectorSvg from '../style/icons/inspector.svg';

export const doubleSharpIcon = new LabIcon({
  name: 'double-sharp:icon',
  svgstr: doubleSharpSvg
});

export const inspectorIcon = new LabIcon({
  name: 'double-sharp:inspector:icon',
  svgstr: inspectorSvg
});
