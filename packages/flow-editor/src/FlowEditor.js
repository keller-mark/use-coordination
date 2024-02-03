import React, { useCallback, useMemo } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge } from 'reactflow';
import { scale as vega_scale } from 'vega-scale';
import { v4 as uuidv4 } from 'uuid';
import { InternMap } from 'internmap';
import { CTypeNode, CScopeNode, ViewNode } from './NodeTypes.js';

const scaleBand = vega_scale('band');

const customStyles = `
  .react-flow__node-default input {
    max-width: 100%;
  }
`;
const styles = `
/* this gets exported as style.css and can be used for the default theming */
/* these are the necessary styles for React Flow, they get used by base.css and style.css */
.react-flow__container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.react-flow__pane {
  z-index: 1;
  cursor: -webkit-grab;
  cursor: grab;
}
.react-flow__pane.selection {
    cursor: pointer;
  }
.react-flow__pane.dragging {
    cursor: -webkit-grabbing;
    cursor: grabbing;
  }
.react-flow__viewport {
  transform-origin: 0 0;
  z-index: 2;
  pointer-events: none;
}
.react-flow__renderer {
  z-index: 4;
}
.react-flow__selection {
  z-index: 6;
}
.react-flow__nodesselection-rect:focus,
.react-flow__nodesselection-rect:focus-visible {
  outline: none;
}
.react-flow .react-flow__edges {
  pointer-events: none;
  overflow: visible;
}
.react-flow__edge-path,
.react-flow__connection-path {
  stroke: #b1b1b7;
  stroke-width: 1;
  fill: none;
}
.react-flow__edge {
  pointer-events: visibleStroke;
  cursor: pointer;
}
.react-flow__edge.animated path {
    stroke-dasharray: 5;
    -webkit-animation: dashdraw 0.5s linear infinite;
            animation: dashdraw 0.5s linear infinite;
  }
.react-flow__edge.animated path.react-flow__edge-interaction {
    stroke-dasharray: none;
    -webkit-animation: none;
            animation: none;
  }
.react-flow__edge.inactive {
    pointer-events: none;
  }
.react-flow__edge.selected,
  .react-flow__edge:focus,
  .react-flow__edge:focus-visible {
    outline: none;
  }
.react-flow__edge.selected .react-flow__edge-path,
  .react-flow__edge:focus .react-flow__edge-path,
  .react-flow__edge:focus-visible .react-flow__edge-path {
    stroke: #555;
  }
.react-flow__edge-textwrapper {
    pointer-events: all;
  }
.react-flow__edge-textbg {
    fill: white;
  }
.react-flow__edge .react-flow__edge-text {
    pointer-events: none;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
  }
.react-flow__connection {
  pointer-events: none;
}
.react-flow__connection .animated {
    stroke-dasharray: 5;
    -webkit-animation: dashdraw 0.5s linear infinite;
            animation: dashdraw 0.5s linear infinite;
  }
.react-flow__connectionline {
  z-index: 1001;
}
.react-flow__nodes {
  pointer-events: none;
  transform-origin: 0 0;
}
.react-flow__node {
  position: absolute;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  pointer-events: all;
  transform-origin: 0 0;
  box-sizing: border-box;
  cursor: -webkit-grab;
  cursor: grab;
}
.react-flow__node.dragging {
    cursor: -webkit-grabbing;
    cursor: grabbing;
  }
.react-flow__nodesselection {
  z-index: 3;
  transform-origin: left top;
  pointer-events: none;
}
.react-flow__nodesselection-rect {
    position: absolute;
    pointer-events: all;
    cursor: -webkit-grab;
    cursor: grab;
  }
.react-flow__handle {
  position: absolute;
  pointer-events: none;
  min-width: 5px;
  min-height: 5px;
  width: 6px;
  height: 6px;
  background: #1a192b;
  border: 1px solid white;
  border-radius: 100%;
}
.react-flow__handle.connectionindicator {
    pointer-events: all;
    cursor: crosshair;
  }
.react-flow__handle-bottom {
    top: auto;
    left: 50%;
    bottom: -4px;
    transform: translate(-50%, 0);
  }
.react-flow__handle-top {
    left: 50%;
    top: -4px;
    transform: translate(-50%, 0);
  }
.react-flow__handle-left {
    top: 50%;
    left: -4px;
    transform: translate(0, -50%);
  }
.react-flow__handle-right {
    right: -4px;
    top: 50%;
    transform: translate(0, -50%);
  }
.react-flow__edgeupdater {
  cursor: move;
  pointer-events: all;
}
.react-flow__panel {
  position: absolute;
  z-index: 5;
  margin: 15px;
}
.react-flow__panel.top {
    top: 0;
  }
.react-flow__panel.bottom {
    bottom: 0;
  }
.react-flow__panel.left {
    left: 0;
  }
.react-flow__panel.right {
    right: 0;
  }
.react-flow__panel.center {
    left: 50%;
    transform: translateX(-50%);
  }
.react-flow__attribution {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 3px;
  margin: 0;
  display: none;
}
.react-flow__attribution a {
    text-decoration: none;
    color: #999;
    display: none;
  }
@-webkit-keyframes dashdraw {
  from {
    stroke-dashoffset: 10;
  }
}
@keyframes dashdraw {
  from {
    stroke-dashoffset: 10;
  }
}
.react-flow__edgelabel-renderer {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.react-flow__edge.updating .react-flow__edge-path {
      stroke: #777;
    }
.react-flow__edge-text {
    font-size: 10px;
  }
.react-flow__node.selectable:focus,
  .react-flow__node.selectable:focus-visible {
    outline: none;
  }
.react-flow__node-default,
.react-flow__node-input,
.react-flow__node-output,
.react-flow__node-group {
  padding: 10px;
  border-radius: 3px;
  width: 150px;
  font-size: 12px;
  color: #222;
  text-align: center;
  border-width: 1px;
  border-style: solid;
  border-color: #1a192b;
  background-color: white;
}
.react-flow__node-default.selectable:hover, .react-flow__node-input.selectable:hover, .react-flow__node-output.selectable:hover, .react-flow__node-group.selectable:hover {
      box-shadow: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
    }
.react-flow__node-default.selectable.selected,
    .react-flow__node-default.selectable:focus,
    .react-flow__node-default.selectable:focus-visible,
    .react-flow__node-input.selectable.selected,
    .react-flow__node-input.selectable:focus,
    .react-flow__node-input.selectable:focus-visible,
    .react-flow__node-output.selectable.selected,
    .react-flow__node-output.selectable:focus,
    .react-flow__node-output.selectable:focus-visible,
    .react-flow__node-group.selectable.selected,
    .react-flow__node-group.selectable:focus,
    .react-flow__node-group.selectable:focus-visible {
      box-shadow: 0 0 0 0.5px #1a192b;
    }
.react-flow__node-group {
  background-color: rgba(240, 240, 240, 0.25);
}
.react-flow__nodesselection-rect,
.react-flow__selection {
  background: rgba(0, 89, 220, 0.08);
  border: 1px dotted rgba(0, 89, 220, 0.8);
}
.react-flow__nodesselection-rect:focus,
  .react-flow__nodesselection-rect:focus-visible,
  .react-flow__selection:focus,
  .react-flow__selection:focus-visible {
    outline: none;
  }
.react-flow__controls {
  box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.08);
}
.react-flow__controls-button {
    border: none;
    background: #fefefe;
    border-bottom: 1px solid #eee;
    box-sizing: content-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 16px;
    height: 16px;
    cursor: pointer;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
    padding: 5px;
  }
.react-flow__controls-button:hover {
      background: #f4f4f4;
    }
.react-flow__controls-button svg {
      width: 100%;
      max-width: 12px;
      max-height: 12px;
    }
.react-flow__controls-button:disabled {
      pointer-events: none;
    }
.react-flow__controls-button:disabled svg {
        fill-opacity: 0.4;
      }
.react-flow__minimap {
  background-color: #fff;
}
.react-flow__resize-control {
  position: absolute;
}
.react-flow__resize-control.left,
.react-flow__resize-control.right {
  cursor: ew-resize;
}
.react-flow__resize-control.top,
.react-flow__resize-control.bottom {
  cursor: ns-resize;
}
.react-flow__resize-control.top.left,
.react-flow__resize-control.bottom.right {
  cursor: nwse-resize;
}
.react-flow__resize-control.bottom.left,
.react-flow__resize-control.top.right {
  cursor: nesw-resize;
}
/* handle styles */
.react-flow__resize-control.handle {
  width: 4px;
  height: 4px;
  border: 1px solid #fff;
  border-radius: 1px;
  background-color: #3367d9;
  transform: translate(-50%, -50%);
}
.react-flow__resize-control.handle.left {
  left: 0;
  top: 50%;
}
.react-flow__resize-control.handle.right {
  left: 100%;
  top: 50%;
}
.react-flow__resize-control.handle.top {
  left: 50%;
  top: 0;
}
.react-flow__resize-control.handle.bottom {
  left: 50%;
  top: 100%;
}
.react-flow__resize-control.handle.top.left {
  left: 0;
}
.react-flow__resize-control.handle.bottom.left {
  left: 0;
}
.react-flow__resize-control.handle.top.right {
  left: 100%;
}
.react-flow__resize-control.handle.bottom.right {
  left: 100%;
}
/* line styles */
.react-flow__resize-control.line {
  border-color: #3367d9;
  border-width: 0;
  border-style: solid;
}
.react-flow__resize-control.line.left,
.react-flow__resize-control.line.right {
  width: 1px;
  transform: translate(-50%, 0);
  top: 0;
  height: 100%;
}
.react-flow__resize-control.line.left {
  left: 0;
  border-left-width: 1px;
}
.react-flow__resize-control.line.right {
  left: 100%;
  border-right-width: 1px;
}
.react-flow__resize-control.line.top,
.react-flow__resize-control.line.bottom {
  height: 1px;
  transform: translate(0, -50%);
  left: 0;
  width: 100%;
}
.react-flow__resize-control.line.top {
  top: 0;
  border-top-width: 1px;
}
.react-flow__resize-control.line.bottom {
  border-bottom-width: 1px;
  top: 100%;
}
${customStyles}
`;

const nodeTypes = {
  cTypeNode: CTypeNode,
  cScopeNode: CScopeNode,
  viewNode: ViewNode,
};

function configToNodesAndEdges(config, width, height) {
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
        data: { label: cType },
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
          data: { label: cScope, value: cValue },
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
        data: { label: viewUid },
        sourcePosition: 'right',
        targetPosition: 'left',
      });
      Object.entries(vObj.coordinationScopes).forEach(([cType, cScope]) => {

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

export function FlowEditor(props) {
  const {
    width = 800,
    height = 600,
    config,
    onConfigChange,

    coordinationTypesEditable = false,

    coordinationScopesEditable = true,
    coordinationValuesEditable = true,

    viewUidsEditable = false,
    viewsRemovable = false,

    viewUidToViewType = null,
    viewTypeToCoordinationTypes = null,

    coordinationTypeToValueEditor = null,

    nodesDraggable = false,
  } = props;

  // TODO: compute initial node positions based on config.key
  // and then assume that the user will drag them around.

  // Additional nodes that are added should not affect the initial positions.
  // Instead, the scales should be extended so that the new nodes do not affect the initial positions.

  const [nodes, edges, idToInfoMappings] = useMemo(() => configToNodesAndEdges(config, width, height), [config, width, height]);

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
    // Changes should result in an updated config emitted via onConfigChange.

    // TODO
  }, [config, onConfigChange, idToInfoMappings]);

  const onEdgesChange = useCallback((changes) => {
    // This is called on edge select and remove.
    // Changes should result in an updated config emitted via onConfigChange.
    const { edgeIdToInfo } = idToInfoMappings;
    let newConfig = { ...config };
    let shouldEmit = false;
    changes.forEach((change) => {
      const { type, id } = change;
      const edgeInfo = edgeIdToInfo.get(id);
      const edgeType = edgeInfoToEdgeType(edgeInfo);
      if(type == 'remove') {
        if(edgeType === 'cScope-view') {
          newConfig = {
            ...newConfig,
            key: newConfig.key + 1,
            viewCoordination: {
              ...newConfig.viewCoordination,
              [edgeInfo.viewUid]: {
                ...newConfig.viewCoordination[edgeInfo.viewUid],
                coordinationScopes: Object.fromEntries(
                  Object.entries(newConfig.viewCoordination[edgeInfo.viewUid].coordinationScopes)
                    .filter(([cType, cScope]) => cType !== edgeInfo.cType)
                ),
              },
            },
          };
          shouldEmit = true;
        }
      }
    });
    if(shouldEmit) {
      onConfigChange(newConfig);
    }
  }, [config, onConfigChange, idToInfoMappings]);

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
      const newConfig = {
        ...config,
        key: config.key + 1,
        viewCoordination: {
          ...config.viewCoordination,
          [targetNodeInfo.viewUid]: {
            ...config.viewCoordination[targetNodeInfo.viewUid],
            coordinationScopes: {
              ...config.viewCoordination[targetNodeInfo.viewUid].coordinationScopes,
              [sourceNodeInfo.cType]: sourceNodeInfo.cScope,
            },
          },
        },
      };
      onConfigChange(newConfig);
    }
  }, [config, onConfigChange, idToInfoMappings]);

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
        />
      </div>
    </>
  );
}