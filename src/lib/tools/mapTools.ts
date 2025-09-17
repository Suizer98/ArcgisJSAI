// Main map tools export file - imports from separate modules
import { drawLineTool, drawPointTool, clearGraphicsTool } from './drawingTools';
import {
  setMapCenterTool,
  setMapZoomTool,
  setMapCenterAndZoomTool,
  getMapStateTool,
  getMapInfoTool,
} from './mapControlTools';
import {
  getCurrentLocationTool,
  centerOnCurrentLocationTool,
} from './locationTools';
import { webSearchTool } from './webSearchTools';

// Export all tools
export const mapTools = {
  // Map control tools
  setMapCenter: setMapCenterTool,
  setMapZoom: setMapZoomTool,
  setMapCenterAndZoom: setMapCenterAndZoomTool,
  getMapState: getMapStateTool,
  getMapInfo: getMapInfoTool,

  // Location tools
  getCurrentLocation: getCurrentLocationTool,
  centerOnCurrentLocation: centerOnCurrentLocationTool,

  // Drawing tools
  drawLine: drawLineTool,
  drawPoint: drawPointTool,
  clearGraphics: clearGraphicsTool,

  // Web search tools
  webSearch: webSearchTool,
};

// Re-export individual tools for direct imports if needed
export {
  // Drawing tools
  drawLineTool,
  drawPointTool,
  clearGraphicsTool,

  // Map control tools
  setMapCenterTool,
  setMapZoomTool,
  setMapCenterAndZoomTool,
  getMapStateTool,
  getMapInfoTool,

  // Location tools
  getCurrentLocationTool,
  centerOnCurrentLocationTool,

  // Web search tools
  webSearchTool,
};
