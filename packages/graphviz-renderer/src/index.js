import * as graphviz from 'graphviz';

const cScopeStyle = { "color": "green" };
const cValueStyle = { "color": "red" };
const viewStyle = { "color": "yellow" };

function addCscopeNode(g, cType, cScope, cValue) {
  const cScopeNode = g.addNode(`cType_${cType}_cScope_${cScope}`, { ...cScopeStyle, label: cScope });
  const cValueNode = g.addNode(`cType_${cType}_cScope_${cScope}_value`, { ...cValueStyle, label: cValue });
  g.addEdge(cScopeNode, cValueNode);

}

function addViewNode(g, view) {
  g.addNode(`view_${view}`, { ...viewStyle, label: view });
}

function addViewScopeEdge(g, view, cType, cScope) {
  g.addEdge(`view_${view}`, `cType_${cType}_cScope_${cScope}`);
}

// TODO: implement using TS
export function toGraphviz(config) {
  const g = graphviz.digraph("G");
  g.set("rankdir", "LR");
  
  // TODO: handle meta-coordination, multi-coordination, and multi-level coordination.

  Object.entries(config.coordinationSpace).forEach(([cType, cObj]) => {
    const cTypeCluster = g.addCluster(`cluster_cType_${cType}`);
    cTypeCluster.set("label", cType);
    
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

  return g.to_dot();
}
