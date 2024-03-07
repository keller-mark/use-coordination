import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';

function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.isConnectable === nextProps.isConnectable
    && prevProps.data === nextProps.data
    && prevProps.data.label === nextProps.data.label
    && prevProps.data.value === nextProps.data.value
    && prevProps.data.onAddScope === nextProps.data.onAddScope
    && prevProps.data.onChangeLabel === nextProps.data.onChangeLabel
    && prevProps.data.onChangeValue === nextProps.data.onChangeValue
  );
}

const handleStyle = {
  background: '#555',
  width: '10px',
  height: '10px',
};

export const CTypeNode = memo(({ data, isConnectable }) => {
  const [label, setLabel] = useState(data.label);
  return (
    <div>
      <div>
        Coordination Type
      </div>
      <div>
        <input className="nodrag" type="text" onChange={e => setLabel(e.target.value)} value={label} />
        {data.label !== label ? <button onClick={() => data.onChangeLabel(label)}>Save</button> : null}
      </div>
      <button onClick={data.onAddScope}>Add scope</button>
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        isConnectable={isConnectable}
      />
    </div>
  );
}, arePropsEqual);

export const CScopeNode = memo(({ data, isConnectable }) => {
  const [label, setLabel] = useState(data.label);
  const [value, setValue] = useState(JSON.stringify(data.value));
  return (
    <div>
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
        isConnectable={isConnectable}
      />
      <div>
        Coordination Scope
      </div>
      <div>
        <input className="nodrag" type="text" onChange={e => setLabel(e.target.value)} value={label} />
        {data.label !== label ? <button onClick={() => data.onChangeLabel(label)}>Save</button> : null}
      </div>
      <div>
        <input className="nodrag" type="text" onChange={e => setValue(e.target.value)} value={value} />
        {/* TODO: Wrap JSON.parse in try/catch */}
        {JSON.stringify(data.value) !== value ? <button onClick={() => data.onChangeValue(JSON.parse(value))}>Save</button> : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        isConnectable={isConnectable}
      />
    </div>
  );
}, arePropsEqual);

export const ViewNode = memo(({ data, isConnectable }) => {
  const [label, setLabel] = useState(data.label);
  return (
    <div>
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
        isConnectable={isConnectable}
      />
      <div>
        View
      </div>
      <div>
      <input className="nodrag" type="text" onChange={e => setLabel(e.target.value)} value={label} />
        {data.label !== label ? <button onClick={() => data.onChangeLabel(label)}>Save</button> : null}
      </div>
    </div>
  );
}, arePropsEqual);