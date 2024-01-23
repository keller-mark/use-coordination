import * as graphviz from 'graphviz';

const cTypeStyle = { "color": "blue" };
const cScopeStyle = { "color": "green" };
const cValueStyle = { "color": "red" };
const viewStyle = { "color": "yellow" };

function addCtypeNode(g, cType) {
  const cTypeNode = g.addNode(`cType_${cType}`, { ...cTypeStyle, label: cType });
  //g.addEdge("coordinationSpace", cTypeNode);
}

function addCscopeNode(outerG, cType, cScope, cValue) {
  const cScopeCluster = outerG.addCluster(`cluster_cType_${cType}_cScope_${cScope}`);
  const g = cScopeCluster;

  const cScopeNode = g.addNode(`cType_${cType}_cScope_${cScope}`, { ...cScopeStyle, label: cScope });
  const cValueNode = g.addNode(`cType_${cType}_cScope_${cScope}_value`, { ...cValueStyle, label: cValue });
  g.addEdge(cScopeNode, `cType_${cType}`, { ltail: `cluster_cType_${cType}_cScope_${cScope}` });
  g.addEdge(cScopeNode, cValueNode);
}

function addViewNode(g, view) {
  const viewNode = g.addNode(`view_${view}`, { ...viewStyle, label: view });
  //g.addEdge("viewCoordination", viewNode);
}

function addViewScopeEdge(g, view, cType, cScope) {

  g.addEdge(`view_${view}`, `cType_${cType}_cScope_${cScope}`, { lhead: `cluster_cType_${cType}_cScope_${cScope}` });

}


export function grammarToGraphviz(config) {
  // Create digraph G
  const g = graphviz.digraph("G");
  g.set("compound", true);
  g.set("rankdir", "LR");

  const coordinationSpace = g.addCluster("cluster_coordinationSpace");
  const viewCoordination = g.addCluster("cluster_viewCoordination");
  
  //coordinationSpace.addNode("coordinationSpace", { label: "coordinationSpace" });
  //viewCoordination.addNode("viewCoordination", { label: "viewCoordination" });

  Object.entries(config.coordinationSpace).forEach(([cType, cObj]) => {

    const cObjCluster = coordinationSpace.addCluster(`cluster_cType_${cType}`);
    addCtypeNode(cObjCluster, cType);
    
    Object.entries(cObj).forEach(([cScope, cValue]) => {
      addCscopeNode(cObjCluster, cType, cScope, cValue);
    });
  });

  Object.entries(config.viewCoordination).forEach(([view, viewObj]) => {
    addViewNode(viewCoordination, view);

    Object.entries(viewObj.coordinationScopes).forEach(([cType, cScope]) => {
      addViewScopeEdge(g, view, cType, cScope);
    });
  });

  return g.to_dot();
}


const initialConfig = {
  key: 1,
  coordinationSpace: {
    "value": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25,
    },
    "color": {
      "A": [255, 0, 0],
      "B": [0, 255, 0],
      "C": [0, 0, 255],
    }
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        value: "A",
        color: "A",
      },
    },
    view2: {
      coordinationScopes: {
        value: "B",
        color: "B",
      },
    },
    view3: {
      coordinationScopes: {
        value: "C",
        color: "C",
      },
    },
  },
};
console.log(grammarToGraphviz(initialConfig))