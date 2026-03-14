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
});
