import { attribute as _, Digraph, Subgraph, Node, Edge, toDot } from 'ts-graphviz';

const cScopeStyle = { [_.color]: "green" };
const cValueStyle = { [_.color]: "red" };
const viewStyle = { [_.color]: "yellow" };

function addCscopeNode(g, cType, cScope, cValue) {
  const cScopeNode = new Node(`cType_${cType}_cScope_${cScope}`, {
    ...cScopeStyle,
    [_.label]: cScope,
  })
  g.addNode(cScopeNode);
  const cValueNode = new Node(`cType_${cType}_cScope_${cScope}_value`, {
    ...cValueStyle,
    [_.label]: JSON.stringify(cValue),
  });
  g.addNode(cValueNode);
  g.addEdge(new Edge([cScopeNode, cValueNode]));
}

function addViewNode(g, view) {
  g.addNode(new Node(`view_${view}`, { ...viewStyle, [_.label]: view }));
}

function addViewScopeEdge(g, view, cType, cScope) {
  g.addEdge(new Edge([new Node(`view_${view}`), new Node(`cType_${cType}_cScope_${cScope}`)]));
}

// TODO: implement using TS
export function toGraphviz(config) {
  const g = new Digraph({
    [_.rankdir]: "LR",
  });  
  // TODO: handle meta-coordination, multi-coordination, and multi-level coordination.

  Object.entries(config.coordinationSpace).forEach(([cType, cObj]) => {
    const cTypeCluster = new Subgraph(`cluster_cType_${cType}`, {
      [_.label]: cType,
    });
    g.addSubgraph(cTypeCluster);
    
    Object.entries(cObj).forEach(([cScope, cValue]) => {
      addCscopeNode(cTypeCluster, cType, cScope, cValue);
    });
  });

  Object.entries(config.viewCoordination).forEach(([view, viewObj]) => {
    addViewNode(g, view);

    Object.entries(viewObj.coordinationScopes).forEach(([cType, cScope]) => {
      addViewScopeEdge(g, view, cType, cScope);
    });
  });

  return toDot(g);
}
