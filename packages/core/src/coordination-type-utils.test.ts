import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { PickValues, PickSetters, SetterName, PickValuesL1, PickSettersL1 } from './coordination-type-utils.js';

const testTypes = {
  sliderValue: z.number(),
  colorValue: z.array(z.number()).nullable(),
  label: z.string(),
};
type T = typeof testTypes;

describe('coordination-type-utils', () => {
  describe('type-level checks', () => {
    it('PickValues produces correct value types', () => {
      type Result = PickValues<T, ['sliderValue', 'label']>;
      const val: Result = { sliderValue: 42, label: 'hello' };
      expect(val.sliderValue).toBe(42);
      expect(val.label).toBe('hello');
    });

    it('PickValues rejects invalid parameter names', () => {
      // @ts-expect-error 'nonExistent' is not a key of T
      type _Bad = PickValues<T, ['nonExistent']>;
    });

    it('PickSetters produces correct setter names and types', () => {
      type Result = PickSetters<T, ['sliderValue']>;
      const setters: Result = { setSliderValue: (_v: number) => {} };
      expect(typeof setters.setSliderValue).toBe('function');
    });

    it('PickSetters rejects invalid parameter names', () => {
      // @ts-expect-error 'nonExistent' is not a key of T
      type _Bad = PickSetters<T, ['nonExistent']>;
    });

    it('SetterName capitalizes correctly', () => {
      type S = SetterName<'sliderValue'>;
      const name: S = 'setSliderValue';
      expect(name).toBe('setSliderValue');
    });

    it('PickValuesL1 wraps in Record<string, ...>', () => {
      type Result = PickValuesL1<T, ['sliderValue']>;
      const val: Result = { scopeA: { sliderValue: 10 } };
      expect(val.scopeA.sliderValue).toBe(10);
    });

    it('PickSettersL1 wraps in Record<string, ...>', () => {
      type Result = PickSettersL1<T, ['sliderValue']>;
      const val: Result = { scopeA: { setSliderValue: (_v: number) => {} } };
      expect(typeof val.scopeA.setSliderValue).toBe('function');
    });
  });

  // These tests validate the precise-key behavior that the `const P` generic parameter
  // on useCoordination enables. `const P` causes TypeScript to infer literal tuple types
  // from the parameters array without requiring `as const` at call sites. The result is
  // that PickValues/PickSetters only expose the requested keys — not all keys of CTypes.
  // Without `const P`, TypeScript would widen to `string[]` and the return type would
  // collapse to `Record<string, unknown>`, making all keys always present.
  describe('PickValues/PickSetters expose only requested keys', () => {
    it('values object only has requested keys — unrequested keys are absent', () => {
      // Requesting only 'sliderValue'; 'colorValue' and 'label' must not appear.
      type Values = PickValues<T, ['sliderValue']>;
      const val: Values = { sliderValue: 10 };
      expect(val.sliderValue).toBe(10);
      // @ts-expect-error colorValue was not requested
      val.colorValue;
      // @ts-expect-error label was not requested
      val.label;
    });

    it('setters object only has requested setters — unrequested setters are absent', () => {
      type Setters = PickSetters<T, ['sliderValue']>;
      const setters: Setters = { setSliderValue: (_v: number) => {} };
      expect(typeof setters.setSliderValue).toBe('function');
      // @ts-expect-error setColorValue was not requested
      setters.setColorValue;
      // @ts-expect-error setLabel was not requested
      setters.setLabel;
    });

    it('setter argument type matches the Zod schema — wrong type is rejected', () => {
      type Setters = PickSetters<T, ['sliderValue']>;
      const setters: Setters = { setSliderValue: (_v: number) => {} };
      // Correct type passes:
      setters.setSliderValue(42);
      // @ts-expect-error string is not assignable to number
      setters.setSliderValue('wrong');
    });

    it('nullable Zod schema produces number[] | null value type', () => {
      // colorValue is z.array(z.number()).nullable() → number[] | null
      type Values = PickValues<T, ['colorValue']>;
      const val: Values = { colorValue: null };
      const col: number[] | null = val.colorValue;
      expect(col).toBeNull();
    });

    it('multiple requested keys are all present with correct types', () => {
      type Values = PickValues<T, ['sliderValue', 'label', 'colorValue']>;
      const val: Values = { sliderValue: 1, label: 'hi', colorValue: [255, 0, 0] };
      const num: number = val.sliderValue;
      const str: string = val.label;
      const col: number[] | null = val.colorValue;
      expect(num).toBe(1);
      expect(str).toBe('hi');
      expect(col).toEqual([255, 0, 0]);
    });
  });
});
