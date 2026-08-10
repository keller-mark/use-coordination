// Helper functions to express multi-level meta-coordination concisely via JSON.


// We want to use the same logic to that used in `addCoordinationByObject` for the forward direction.

export function expandMultiLevelObject(inputObj) {
  /*
    Input:
    {
      spatialImageLayer: { "$CL": [
        {
          image: { "$value": 'S-1905-017737_bf' },
          spatialLayerVisible: { "$value": true },
          spatialLayerOpacity: { "$value": 1 },
          spatialImageChannel: { "$CL": [
            {
              spatialTargetC: { "$value": 0 },
              spatialChannelColor: { "$value": [255, 0, 0] },
            },
            {
              spatialTargetC: { "$value": 1 },
              spatialChannelColor: { "$scope": "myExistingColorScope" },
            },
          ] },
        },
      ] },
    }

    Output: see addCoordinationByObject unit tests
  */
}
