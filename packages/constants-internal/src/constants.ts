/**
 * Constants representing names of coordination types,
 * to help prevent typos.
 */
export const CoordinationType = {
  META_COORDINATION_SCOPES: 'metaCoordinationScopes',
  META_COORDINATION_SCOPES_BY: 'metaCoordinationScopesBy',
  DATASET: 'dataset',
  // Entity types
  OBS_TYPE: 'obsType',
  FEATURE_TYPE: 'featureType',
  FEATURE_VALUE_TYPE: 'featureValueType',
  // Other types
  FILE_UID: 'fileUid',
  IMAGE_LAYER: 'imageLayer',
  IMAGE_CHANNEL: 'imageChannel',
  SEGMENTATION_LAYER: 'segmentationLayer',
  SEGMENTATION_CHANNEL: 'segmentationChannel',
  SPATIAL_TARGET_C: 'spatialTargetC',
  SPATIAL_LAYER_VISIBLE: 'spatialLayerVisible',
  SPATIAL_LAYER_OPACITY: 'spatialLayerOpacity',
  SPATIAL_LAYER_COLORMAP: 'spatialLayerColormap',
  SPATIAL_LAYER_TRANSPARENT_COLOR: 'spatialLayerTransparentColor',
  SPATIAL_LAYER_MODEL_MATRIX: 'spatialLayerModelMatrix',
  SPATIAL_SEGMENTATION_FILLED: 'spatialSegmentationFilled',
  SPATIAL_SEGMENTATION_STROKE_WIDTH: 'spatialSegmentationStrokeWidth',
  SPATIAL_CHANNEL_COLOR: 'spatialChannelColor',
  SPATIAL_CHANNEL_VISIBLE: 'spatialChannelVisible',
  SPATIAL_CHANNEL_OPACITY: 'spatialChannelOpacity',
  SPATIAL_CHANNEL_WINDOW: 'spatialChannelWindow',
  SPATIAL_RENDERING_MODE: 'spatialRenderingMode', // For whole spatial view
  SPATIAL_TARGET_RESOLUTION: 'spatialTargetResolution', // Per-spatial-layer
  SPATIAL_SPOT_RADIUS: 'spatialSpotRadius', // In micrometers?
  SPATIAL_SPOT_FILLED: 'spatialSpotFilled',
  SPATIAL_SPOT_STROKE_WIDTH: 'spatialSpotStrokeWidth',
  SPATIAL_LAYER_COLOR: 'spatialLayerColor',
  SPATIAL_CHANNEL_LABELS_VISIBLE: 'spatialChannelLabelsVisible',
  SPATIAL_CHANNEL_LABELS_ORIENTATION: 'spatialChannelLabelsOrientation',
  SPATIAL_CHANNEL_LABEL_SIZE: 'spatialChannelLabelSize',
};
