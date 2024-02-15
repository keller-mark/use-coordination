import React, { useCallback, useMemo } from 'react';
import ReactFlow, { Panel, Background, Controls } from 'reactflow';
import { scale as vega_scale } from 'vega-scale';
import { v4 as uuidv4 } from 'uuid';
import { InternMap } from 'internmap';
import { CTypeNode, CScopeNode, ViewNode } from './NodeTypes.js';
import {
  connectViewToScope,
  disconnectViewFromScope,
  addScopeForType,
  addCoordinationType,
  addView,
  removeCoordinationType,
  removeView,
  changeCoordinationTypeName,
  changeCoordinationScopeName,
  changeCoordinationScopeValue,
  changeViewUid,
  removeCoordinationScope,
} from './utils.js';
import { styles } from './styles.js';

const scaleBand = vega_scale('band');

const nodeTypes = {
  cTypeNode: CTypeNode,
  cScopeNode: CScopeNode,
  viewNode: ViewNode,
};

function configToNodesAndEdges(config, width, height, eventHandlers) {
  const {
    onAddScope,
    onChangeCoordinationTypeName,
    onChangeCoordinationScopeName,
    onChangeCoordinationScopeValue,
    onChangeViewUid,
  } = eventHandlers;
  const nodesArr = [];
  const edgesArr = [];

  const nodeIdToInfo = new Map();
  const edgeIdToInfo = new Map();

  const nodeInfoToId = new InternMap([], JSON.stringify);
  const edgeInfoToId = new InternMap([], JSON.stringify);

  if (config) {
    const { coordinationSpace = {}, viewCoordination = {} } = config;
    
    const xScale = scaleBand()
      .domain(["cType", "cScope", "view"])
      .range([0, width])
    const cTypeYScale = scaleBand()
      .domain(Object.keys(coordinationSpace))
      .range([0, height]);
    const cScopeYScale = scaleBand()
      .domain(Object.keys(coordinationSpace).reduce((acc, cType) => acc.concat(Object.keys(coordinationSpace[cType]).map(cScope => `${cType}_${cScope}`)), []))
      .range([0, height]);
    const viewYScale = scaleBand()
      .domain(Object.keys(viewCoordination))
      .range([0, height]);


    Object.entries(coordinationSpace).forEach(([cType, cObj]) => {
      const cTypeNodeId = uuidv4();
      const cTypeNodeInfo = { cType };
      nodeIdToInfo.set(cTypeNodeId, cTypeNodeInfo);
      nodeInfoToId.set(cTypeNodeInfo, cTypeNodeId);

      nodesArr.push({
        id: cTypeNodeId,
        type: 'cTypeNode',
        position: { x: xScale("cType"), y: cTypeYScale(cType) },
        data: {
          label: cType,
          onAddScope: () => onAddScope(cType),
          onChangeLabel: (newName) => {
            onChangeCoordinationTypeName(cType, newName);
          }
        },
        sourcePosition: 'right',
        targetPosition: 'left',
      });

      Object.entries(cObj).forEach(([cScope, cValue]) => {
        const cTypeScopeEdgeId = uuidv4();
        const cTypeScopeEdgeInfo = { cType, cScope };
        edgeIdToInfo.set(cTypeScopeEdgeId, cTypeScopeEdgeInfo);
        edgeInfoToId.set(cTypeScopeEdgeInfo, cTypeScopeEdgeId);

        const cScopeNodeId = uuidv4();
        const cScopeNodeInfo = { cType, cScope };
        nodeIdToInfo.set(cScopeNodeId, cScopeNodeInfo);
        nodeInfoToId.set(cScopeNodeInfo, cScopeNodeId);

        edgesArr.push({
          id: cTypeScopeEdgeId,
          source: cTypeNodeId,
          target: cScopeNodeId,
        });
        
        nodesArr.push({
          id: cScopeNodeId,
          type: 'cScopeNode',
          position: { x: xScale("cScope"), y: cScopeYScale(`${cType}_${cScope}`) },
          data: {
            label: cScope,
            value: cValue,
            onChangeLabel: (newName) => {
              onChangeCoordinationScopeName(cType, cScope, newName);
            },
            onChangeValue: (newValue) => {
              onChangeCoordinationScopeValue(cType, cScope, newValue);
            },
          },
          sourcePosition: 'right',
          targetPosition: 'left',
        });
      });
    });
  
    Object.entries(viewCoordination).forEach(([viewUid, vObj]) => {
      const viewNodeId = uuidv4();
      // TODO: include the view type in the viewNodeInfo
      const viewNodeInfo = { viewUid };
      nodeIdToInfo.set(viewNodeId, viewNodeInfo);
      nodeInfoToId.set(viewNodeInfo, viewNodeId);

      nodesArr.push({
        id: viewNodeId,
        type: 'viewNode',
        position: { x: xScale("view"), y: viewYScale(viewUid) },
        data: {
          label: viewUid,
          onChangeLabel: (newName) => {
            onChangeViewUid(viewUid, newName);
          },
        },
        sourcePosition: 'right',
        targetPosition: 'left',
      });
      Object.entries(vObj.coordinationScopes || {}).forEach(([cType, cScope]) => {
        const viewScopeEdgeId = uuidv4();
        const viewScopeEdgeInfo = { viewUid, cType, cScope };

        edgeIdToInfo.set(viewScopeEdgeId, viewScopeEdgeInfo);
        edgeInfoToId.set(viewScopeEdgeInfo, viewScopeEdgeId);

        const cScopeNodeId = nodeInfoToId.get({ cType, cScope });

        edgesArr.push({
          id: viewScopeEdgeId,
          source: cScopeNodeId,
          target: viewNodeId,
        });
      });
    });
  }
  return [nodesArr, edgesArr, { nodeIdToInfo, edgeIdToInfo, nodeInfoToId, edgeInfoToId }];
}

function nodeInfoToNodeType(nodeInfo) {
  return Object.keys(nodeInfo).includes('viewUid')
    ? 'view' : (Object.keys(nodeInfo).includes('cScope')
      ? 'cScope'
      : 'cType');
}

function edgeInfoToEdgeType(edgeInfo) {
  return Object.keys(edgeInfo).includes('viewUid')
    ? 'cScope-view'
    : 'cType-cScope';
}

function CoordinationControls(props) {
  const { onAddType, onAddView } = props;
  return (
    <Panel position="bottom-right">
      <button onClick={onAddType}>Add coordination type</button>&nbsp;
      <button onClick={onAddView}>Add view</button>
    </Panel>
  );
}

export function FlowEditor(props) {
  const {
    width = 800,
    height = 600,
    config,
    onSpecChange,

    coordinationTypesAddable = true,
    coordinationTypesEditable = false, // Allow coordination type names to be changed via text input

    coordinationScopesEditable = true,
    coordinationValuesEditable = true,

    viewsEditable = false, // Allow viewUids to be changed via text input
    viewsRemovable = false,
    viewsAddable = true,

    viewUidToViewType = null,
    viewTypeToCoordinationTypes = null,

    nodesDraggable = false,
  } = props;

  console.log(config);

  // TODO: compute initial node positions based on config.key
  // and then assume that the user will drag them around.

  // Additional nodes that are added should not affect the initial positions.
  // Instead, the scales should be extended so that the new nodes do not affect the initial positions.
  const onAddScope = useCallback((cType) => {
    onSpecChange({
      ...addScopeForType(config, cType),
      key: config.key + 1,
    });
  }, [config]);

  const onChangeCoordinationTypeName = useCallback((prevName, newName) => {
    onSpecChange({
      ...changeCoordinationTypeName(config, prevName, newName),
      key: config.key + 1,
    });
  }, [config, onSpecChange]);

  const onChangeCoordinationScopeName = useCallback((cType, prevName, newName) => {
    onSpecChange({
      ...changeCoordinationScopeName(config, cType, prevName, newName),
      key: config.key + 1,
    });
  }, [config, onSpecChange]);

  const onChangeCoordinationScopeValue = useCallback((cType, cScope, newValue) => {
    onSpecChange({
      ...changeCoordinationScopeValue(config, cType, cScope, newValue),
      key: config.key + 1,
    });
  }, [config, onSpecChange]);

  const onChangeViewUid = useCallback((prevUid, newUid) => {
    onSpecChange({
      ...changeViewUid(config, prevUid, newUid),
      key: config.key + 1,
    });
  }, [config, onSpecChange]);

  const [nodes, edges, idToInfoMappings] = useMemo(() => configToNodesAndEdges(
    config, width, height,
    {
      onAddScope,
      onChangeCoordinationTypeName,
      onChangeCoordinationScopeName,
      onChangeCoordinationScopeValue,
      onChangeViewUid,
    },
  ), [config, width, height]);

  const isValidConnection = useCallback((connection) => {
    const { nodeIdToInfo } = idToInfoMappings;
    const sourceNodeInfo = nodeIdToInfo.get(connection.source);
    const targetNodeInfo = nodeIdToInfo.get(connection.target);

    const sourceNodeType = nodeInfoToNodeType(sourceNodeInfo);
    const targetNodeType = nodeInfoToNodeType(targetNodeInfo);

    if(sourceNodeType == 'cScope' && targetNodeType == 'view') {
      // TODO: check if the view type supports the coordination type of the scope.
      return true;
    }
    if(sourceNodeType == 'cType' && targetNodeInfo == 'cScope') {
      // Check if the scope is for this coordination
      if(sourceNodeInfo.cType == targetNodeInfo.cType) {
        return true;
      }
    }
    return false;
  }, [idToInfoMappings]);

  const onNodesChange = useCallback((changes) => {
    // This is called on node drag, select, and move.
    // Changes should result in an updated config emitted via onSpecChange.

    const { nodeIdToInfo } = idToInfoMappings;
    let newSpec = { ...config };
    let shouldEmit = false;
    changes.forEach((change) => {
      const { type, id } = change;
      const nodeInfo = nodeIdToInfo.get(id);
      const nodeType = nodeInfoToNodeType(nodeInfo);
      if(type == 'remove') {
        if(nodeType === 'cType') {
          newSpec = removeCoordinationType(newSpec, nodeInfo.cType);
          shouldEmit = true;
        }
        if(nodeType === 'view') {
          newSpec = removeView(newSpec, nodeInfo.viewUid);
          shouldEmit = true;
        }
        if(nodeType === 'cScope') {
          newSpec = removeCoordinationScope(newSpec, nodeInfo.cType, nodeInfo.cScope);
          shouldEmit = true;
        }
      }
    });
    if(shouldEmit) {
      newSpec = {
        ...newSpec,
        key: newSpec.key + 1,
      };
      onSpecChange(newSpec);
    }
  }, [config, onSpecChange, idToInfoMappings]);

  const onEdgesChange = useCallback((changes) => {
    // This is called on edge select and remove.
    // Changes should result in an updated config emitted via onSpecChange.
    const { edgeIdToInfo } = idToInfoMappings;
    let newSpec = { ...config };
    let shouldEmit = false;
    changes.forEach((change) => {
      const { type, id } = change;
      const edgeInfo = edgeIdToInfo.get(id);
      const edgeType = edgeInfoToEdgeType(edgeInfo);
      if(type == 'remove') {
        if(edgeType === 'cScope-view') {
          newSpec = disconnectViewFromScope(
            newSpec,
            edgeInfo.viewUid,
            edgeInfo.cType,
          );
          shouldEmit = true;
        }
      }
    });
    if(shouldEmit) {
      newSpec = {
        ...newSpec,
        key: newSpec.key + 1,
      };
      onSpecChange(newSpec);
    }
  }, [config, onSpecChange, idToInfoMappings]);

  const onConnect = useCallback((connection) => {
    // When a connection line is completed and two nodes are
    // connected by the user, this event fires with the new connection.
    const { nodeIdToInfo } = idToInfoMappings;
    const { source, target } = connection;

    const sourceNodeInfo = nodeIdToInfo.get(source);
    const targetNodeInfo = nodeIdToInfo.get(target);

    const sourceNodeType = nodeInfoToNodeType(sourceNodeInfo);
    const targetNodeType = nodeInfoToNodeType(targetNodeInfo);

    if(sourceNodeType == 'cScope' && targetNodeType == 'view') {
      const newSpec = {
        ...connectViewToScope(
          config,
          targetNodeInfo.viewUid,
          sourceNodeInfo.cType,
          sourceNodeInfo.cScope,
        ),
        key: config.key + 1,
      };
      onSpecChange(newSpec);
    }
  }, [config, onSpecChange, idToInfoMappings]);

  const onAddType = useCallback(() => {
    const newSpec = {
      ...addCoordinationType(config),
      key: config.key + 1,
    };
    onSpecChange(newSpec);
  }, [config]);

  const onAddView = useCallback(() => {
    const newSpec = {
      ...addView(config),
      key: config.key + 1,
    };
    onSpecChange(newSpec);
  }, [config]);

  return (
    <>
      <style>{styles}</style>
      <div style={{ width, height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          nodesDraggable={nodesDraggable}
        >
          <Controls />
          <Background />
          <CoordinationControls
            onAddType={onAddType}
            onAddView={onAddView}
          />
        </ReactFlow>
      </div>
    </>
  );
}