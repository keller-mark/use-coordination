import React from 'react';
import { useCoordinationScopes, useCoordinationL1, useCoordinationObject } from '@use-coordination/all';

function ColorPicker(props: any) {
  const {
    barValue,
    barColor,
    setBarColor,
  } = props;

  return (
    <p>
      <span style={{ fontSize: '18px', marginRight: '10px' }}>{barValue}</span>
      <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
    </p>
  )
}

export function MultilevelColors(props: any) {
  const {
    viewUid,
  } = props;

  const selectionScopes = useCoordinationScopes(viewUid, "barSelection");
  const selectionValues = useCoordinationObject(viewUid, "barSelection");
  const selectionCoordination = useCoordinationL1(viewUid, "barSelection", ["barColor"]);

  return (
    <div>
    <h4>Color pickers for selected letters</h4>
    {selectionScopes.map((scope: string) => (
      <ColorPicker
        key={scope}
        barValue={selectionValues[scope]}
        barColor={selectionCoordination[0][scope].barColor}
        setBarColor={selectionCoordination[1][scope].setBarColor}
      />
    ))}
    </div>
  );
}