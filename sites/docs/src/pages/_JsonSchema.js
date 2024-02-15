import React from 'react';
import CodeBlock from "@theme/CodeBlock";
import jsonSchema from '@use-coordination/json-schema/dist/spec.schema.json';

export function GenericSpecJsonSchema(props) {
  return (
    <CodeBlock
      language="jsx"
      showLineNumbers
    >
      {JSON.stringify(jsonSchema, null, 2)}
    </CodeBlock>
  );
}
