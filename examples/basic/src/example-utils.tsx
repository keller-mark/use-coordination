import React from 'react';

export function SelectScope(props: any) {
  const {
    spec,
    viewUid,
    cType = "sliderValue",
    onSpecChange,
    showType = false,
  } = props;

  const allScopes = Object.keys(spec.coordinationSpace[cType]);

  function handleChange(event: any) {
    const newScope = event.target.value;
    const newSpec = {
      ...spec,
      key: spec.key + 1,
      viewCoordination: {
        ...spec.viewCoordination,
        [viewUid]: {
          ...spec.viewCoordination[viewUid],
          coordinationScopes: {
            ...spec.viewCoordination[viewUid].coordinationScopes,
            [cType]: newScope,
          },
        },
      },
    };
    onSpecChange(newSpec)
  }

  return (
    <>
      <label>{showType ? cType : "Coordination"} scope for {viewUid}:&nbsp;</label>
      <select onChange={handleChange} value={spec.viewCoordination[viewUid].coordinationScopes[cType]}>
        {allScopes.map((scope: any) => (
          <option key={scope} value={scope}>{scope}</option>
        ))}
      </select>
    </>
  )
}

export function MetaSelectScope(props: any) {
    const {
      spec,
      viewUid,
      cType = "sliderValue",
      onSpecChange,
    } = props;
    
    const allMetaScopes = Object.keys(spec.coordinationSpace["metaCoordinationScopes"]);
    const allScopes = Object.keys(spec.coordinationSpace[cType]);

    const currMetaScope = spec.viewCoordination[viewUid].coordinationScopes["metaCoordinationScopes"];

    // Update the value of the coordination scope within the meta-scope.
    function handleMetaChange(event: any) {
      const newScope = event.target.value;
      const newSpec = {
        ...spec,
        key: spec.key + 1,
        coordinationSpace: {
          ...spec.coordinationSpace,
          "metaCoordinationScopes": {
            ...spec.coordinationSpace["metaCoordinationScopes"],
            [currMetaScope]: {
              ...spec.coordinationSpace["metaCoordinationScopes"][currMetaScope],
              [cType]: newScope,
            },
          },
        },
      };
      onSpecChange(newSpec)
    }
      
    // Update the meta-scope for the view.
    function handleChange(event: any) {
      const newScope = event.target.value;
      const newSpec = {
        ...spec,
        key: spec.key + 1,
        viewCoordination: {
            ...spec.viewCoordination,
          [viewUid]: {
            ...spec.viewCoordination[viewUid],
            coordinationScopes: {
              ...spec.viewCoordination[viewUid].coordinationScopes,
              ["metaCoordinationScopes"]: newScope,
            },
          },
        },
      };
      onSpecChange(newSpec)
    }
  
    return (
      <>
        <label>Meta-scope for {viewUid}:&nbsp;</label>
        <select onChange={handleChange} value={spec.viewCoordination[viewUid].coordinationScopes["metaCoordinationScopes"]}>
          {allMetaScopes.map((scope: any) => (
            <option key={scope} value={scope}>{scope}</option>
          ))}
        </select>
        <label>&nbsp; {cType} scope for meta-scope {currMetaScope}:&nbsp;</label>
        <select onChange={handleMetaChange} value={spec.coordinationSpace["metaCoordinationScopes"][currMetaScope][cType]}>
          {allScopes.map((scope: any) => (
            <option key={scope} value={scope}>{scope}</option>
          ))}
        </select>
      </>
    )
  }