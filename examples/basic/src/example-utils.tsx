import React from 'react';

export function SelectScope(props: any) {
  const {
    config,
    viewUid,
    cType = "sliderValue",
    onSpecChange,
    showType = false,
  } = props;

  const allScopes = Object.keys(config.coordinationSpace[cType]);

  function handleChange(event: any) {
    const newScope = event.target.value;
    const newConfig = {
      ...config,
      key: config.key + 1,
      viewCoordination: {
        ...config.viewCoordination,
        [viewUid]: {
          ...config.viewCoordination[viewUid],
          coordinationScopes: {
            ...config.viewCoordination[viewUid].coordinationScopes,
            [cType]: newScope,
          },
        },
      },
    };
    onSpecChange(newConfig)
  }

  return (
    <>
      <label>{showType ? cType : "Coordination"} scope for {viewUid}:&nbsp;</label>
      <select onChange={handleChange} value={config.viewCoordination[viewUid].coordinationScopes[cType]}>
        {allScopes.map((scope: any) => (
          <option key={scope} value={scope}>{scope}</option>
        ))}
      </select>
    </>
  )
}

export function MetaSelectScope(props: any) {
    const {
      config,
      viewUid,
      cType = "sliderValue",
      onSpecChange,
    } = props;
    
    const allMetaScopes = Object.keys(config.coordinationSpace["metaCoordinationScopes"]);
    const allScopes = Object.keys(config.coordinationSpace[cType]);

    const currMetaScope = config.viewCoordination[viewUid].coordinationScopes["metaCoordinationScopes"];

    // Update the value of the coordination scope within the meta-scope.
    function handleMetaChange(event: any) {
      const newScope = event.target.value;
      const newConfig = {
        ...config,
        key: config.key + 1,
        coordinationSpace: {
          ...config.coordinationSpace,
          "metaCoordinationScopes": {
            ...config.coordinationSpace["metaCoordinationScopes"],
            [currMetaScope]: {
              ...config.coordinationSpace["metaCoordinationScopes"][currMetaScope],
              [cType]: newScope,
            },
          },
        },
      };
      onSpecChange(newConfig)
    }
      
    // Update the meta-scope for the view.
    function handleChange(event: any) {
      const newScope = event.target.value;
      const newConfig = {
        ...config,
        key: config.key + 1,
        viewCoordination: {
            ...config.viewCoordination,
          [viewUid]: {
            ...config.viewCoordination[viewUid],
            coordinationScopes: {
              ...config.viewCoordination[viewUid].coordinationScopes,
              ["metaCoordinationScopes"]: newScope,
            },
          },
        },
      };
      onSpecChange(newConfig)
    }
  
    return (
      <>
        <label>Meta-scope for {viewUid}:&nbsp;</label>
        <select onChange={handleChange} value={config.viewCoordination[viewUid].coordinationScopes["metaCoordinationScopes"]}>
          {allMetaScopes.map((scope: any) => (
            <option key={scope} value={scope}>{scope}</option>
          ))}
        </select>
        <label>&nbsp; {cType} scope for meta-scope {currMetaScope}:&nbsp;</label>
        <select onChange={handleMetaChange} value={config.coordinationSpace["metaCoordinationScopes"][currMetaScope][cType]}>
          {allScopes.map((scope: any) => (
            <option key={scope} value={scope}>{scope}</option>
          ))}
        </select>
      </>
    )
  }