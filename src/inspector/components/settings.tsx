import * as React from 'react';

import Checkbox from '../../ui/checkbox';

// export interface ISettingsProps {}

export default function Settings() {
  return (
    <Checkbox
      className="jp-DoubleSharp-Settings-row"
      checked={true}
      // onChange={e => onChange(e.target.checked)}
    >
      settings...
    </Checkbox>
  );
}