import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useCoordination, useCoordinationScopesL1, useCoordinationL1 } from '@use-coordination/all';

function ColorPicker(props: any) {
  const {
    barValue,
    barColor,
    setBarColor,
  } = props;

  return (
    <p>
      {barValue}
      <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
    </p>
  )
}

export function MultilevelColors(props: any) {
  const {
    viewUid,
  } = props;

  const selectionScopes = useCoordinationScopesL1(viewUid, "barSelection");
  const selectionCoordination = useCoordinationL1(viewUid, "barSelection", ["barColor", "barValue"]);

  return (
    <>
    {selectionScopes.map((scope: string) => (
      <ColorPicker
        barValue={selectionCoordination[0][scope].barValue}
        barColor={selectionCoordination[0][scope].barColor}
        setBarColor={selectionCoordination[1][scope].setBarColor}
      />
    ))}
    </>
  );
}