import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';

export const CTypeNode = memo(({ data, isConnectable }) => {
  return (
    <div className={clsx('react-flow__node-default', 'ctype-node')}>
      <div>
        Coordination Type
      </div>
      <input className="nodrag" type="text" onChange={data.onChangeLabel} defaultValue={data.label} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export const CScopeNode = memo(({ data, isConnectable }) => {
  return (
    <div className={clsx('react-flow__node-default', 'cscope-node')}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div>
        Coordination Scope
      </div>
      <input className="nodrag" type="text" onChange={data.onChangeLabel} defaultValue={data.label} />
      <input className="nodrag" type="text" onChange={data.onChangeValue} defaultValue={JSON.stringify(data.value)} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export const ViewNode = memo(({ data, isConnectable }) => {
  return (
    <div className={clsx('react-flow__node-default', 'view-node')}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div>
        View
      </div>
      <input className="nodrag" type="text" onChange={data.onChangeLabel} defaultValue={data.label} />
    </div>
  );
});