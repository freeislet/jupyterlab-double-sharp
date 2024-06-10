import { LabIcon } from '@jupyterlab/ui-components';

import doubleSharpSvg from '../style/icons/double-sharp.svg';
import cellPropertiesSvg from '../style/icons/cell-properties.svg';

export const doubleSharpIcon = new LabIcon({
  name: 'double-sharp:icon',
  svgstr: doubleSharpSvg
});

export const cellPropertiesIcon = new LabIcon({
  name: 'double-sharp:cell-properties:icon',
  svgstr: cellPropertiesSvg
});
