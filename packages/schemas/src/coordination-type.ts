import { z } from 'zod';

export class CoordinationType<T1 extends z.ZodTypeAny> {
  name: string;

  defaultValue: z.infer<T1>;

  valueSchema: T1;

  constructor(name: string, defaultValue: z.infer<T1>, valueSchema: T1) {
    this.name = name;
    this.defaultValue = defaultValue;
    this.valueSchema = valueSchema;
  }
}
