import { describe, it, expect } from 'vitest';
import {
  getParameterScope,
  getParameterScopeBy,
  getScopes,
  getScopesBy,
} from './hooks.js';

describe('provider/hooks.js', () => {
  describe('getParameterScope', () => {
    it('works', () => {
      expect(getParameterScope(
        {
          obsType: 'A',
        },
        'obsType',
      )).toEqual('A');
    });
  });
  describe('getParameterScopeBy', () => {
    it('works', () => {
      expect(getParameterScopeBy(
        {
          spatialSegmentationLayer: ['glomerulus', 'tubule'],
        },
        {
          spatialSegmentationLayer: {
            spatialTargetC: {
              glomerulus: 'A',
              tubule: 'B',
            },
          },
        },
        'spatialSegmentationLayer',
        'glomerulus',
        'spatialTargetC',
      )).toEqual('A');
    });
  });
  describe('getScopes', () => {
    it('works without metaCoordinationScopes', () => {
      expect(getScopes(
        {},
        {
          obsType: 'A',
        },
      )).toEqual({
        obsType: 'A',
      });
    });
    it('works with one metaCoordinationScopes', () => {
      expect(getScopes(
        {
          metaA: {
            obsType: 'B',
          },
        },
        {
          // meta match should take precedence
          metaCoordinationScopes: 'metaA',
          obsType: 'A',
        },
      )).toEqual({
        // meta match should take precedence
        metaCoordinationScopes: 'metaA',
        obsType: 'B',
      });
    });
    it('works with multiple metaCoordinationScopes', () => {
      expect(getScopes(
        {
          metaA: {
            featureType: 'D',
          },
          metaB: {
            obsType: 'C',
          },
        },
        {
          // first meta match should take precedence
          metaCoordinationScopes: ['metaA', 'metaB'],
          obsType: 'A',
        },
      )).toEqual({
        // first meta match should take precedence
        metaCoordinationScopes: ['metaA', 'metaB'],
        featureType: 'D',
        obsType: 'C',
      });
    });
  });
  describe('getScopesBy', () => {
    it('works with one metaCoordinationScopesBy', () => {
      expect(getScopesBy(
        {
          metaA: {
            spatialSegmentationLayer: {
              spatialTargetC: {
                glomerulus: 'A',
                tubule: 'B',
              },
            },
          },
        },
        {
          metaCoordinationScopesBy: 'metaA',
          spatialSegmentationLayer: ['abc', 'def'],
        },
        {
          spatialSegmentationLayer: {
            spatialTargetC: {
              glomerulus: 'ghi',
              tubule: 'jkl',
            },
          },
        },
      )).toEqual({
        spatialSegmentationLayer: {
          spatialTargetC: {
            glomerulus: 'A',
            tubule: 'B',
          },
        },
      });
    });
    it('works with multiple metaCoordinationScopes', () => {
      expect(getScopesBy(
        {
          metaA: {
            spatialSegmentationLayer: {
              spatialLayerOpacity: {
                glomerulus: 'C',
                tubule: 'D',
              },
            },
          },
          metaB: {
            spatialSegmentationLayer: {
              spatialTargetC: {
                glomerulus: 'A',
                tubule: 'B',
              },
            },
          },
        },
        {
          metaCoordinationScopesBy: ['metaA', 'metaB'],
          spatialSegmentationLayer: ['abc', 'def'],
        },
        {
          spatialSegmentationLayer: {
            spatialTargetC: {
              glomerulus: 'ghi',
              tubule: 'jkl',
            },
          },
        },
      )).toEqual({
        spatialSegmentationLayer: {
          spatialLayerOpacity: {
            glomerulus: 'C',
            tubule: 'D',
          },
          spatialTargetC: {
            glomerulus: 'A',
            tubule: 'B',
          },
        },
      });
    });
  });
});
