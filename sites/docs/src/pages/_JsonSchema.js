import React from 'react';
import CodeBlock from "@theme/CodeBlock";
import jsonSchema from '@use-coordination/json-schema/dist/config.schema.json';

export function GenericConfigJsonSchema(props) {
  return (
    <CodeBlock
      language="jsx"
      showLineNumbers
    >
      {JSON.stringify(jsonSchema, null, 2)}
    </CodeBlock>
  );
}
