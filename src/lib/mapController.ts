// Map Controller for AI integration
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Circle from "@arcgis/core/geometry/Circle";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

class MapController {
  private view: MapView | null = null;
  private listeners: Array<(center: {lat: number, lng: number}, zoom: number) => void> = [];
  private graphicsLayer: GraphicsLayer | null = null;

  setMapView(view: MapView) {
    this.view = view;
    
    // Create graphics layer for drawing
    this.graphicsLayer = new GraphicsLayer();
    if (view.map) {
      view.map.add(this.graphicsLayer);
    }
    
    // Watch for changes and notify listeners
    view.watch("center", (center) => {
      if (center) {
        this.notifyListeners({
          lat: center.latitude,
          lng: center.longitude
        }, view.zoom ?? 1);
      }
    });

    view.watch("zoom", (zoom) => {
      if (view.center) {
        this.notifyListeners({
          lat: view.center.latitude ?? 0,
          lng: view.center.longitude ?? 0
        }, zoom ?? 1);
      }
    });
  }

  // Helper method to convert hex color to RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 255, g: 0, b: 0}; // Default to red
  }

  // Draw a line on the map
  async drawLine(startLat: number, startLng: number, endLat: number, endLng: number, color: string = "#FF0000"): Promise<{success: boolean, message: string}> {
    if (!this.view || !this.graphicsLayer) {
      return { success: false, message: "Map not initialized" };
    }

    try {
      const polyline = new Polyline({
        paths: [[[startLng, startLat], [endLng, endLat]]] // ArcGIS uses [lng, lat] format
      });

      const rgb = this.hexToRgb(color);
      const lineSymbol = new SimpleLineSymbol({
        color: [rgb.r, rgb.g, rgb.b, 255],
        width: 3
      });

      const graphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
      });

      this.graphicsLayer.add(graphic);
      
      return { 
        success: true, 
        message: `Line drawn from (${startLat.toFixed(4)}, ${startLng.toFixed(4)}) to (${endLat.toFixed(4)}, ${endLng.toFixed(4)})` 
      };
    } catch (error) {
      console.error("Error drawing line:", error);
      return { 
        success: false, 
        message: "Failed to draw line" 
      };
    }
  }

  // Draw a point on the map
  async drawPoint(lat: number, lng: number, color: string = "#FF0000", size: number = 10, label?: string): Promise<{success: boolean, message: string}> {
    if (!this.view || !this.graphicsLayer) {
      return { success: false, message: "Map not initialized" };
    }

    try {
      const point = new Point({
        longitude: lng,
        latitude: lat
      });

      const rgb = this.hexToRgb(color);
      const markerSymbol = new SimpleMarkerSymbol({
        color: [rgb.r, rgb.g, rgb.b, 255],
        size: size,
        outline: {
          color: [0, 0, 0, 255],
          width: 1
        }
      });

      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      this.graphicsLayer.add(graphic);
      
      return { 
        success: true, 
        message: `Point drawn at (${lat.toFixed(4)}, ${lng.toFixed(4)})${label ? ` with label "${label}"` : ''}` 
      };
    } catch (error) {
      console.error("Error drawing point:", error);
      return { 
        success: false, 
        message: "Failed to draw point" 
      };
    }
  }

  // Clear all graphics from the map
  async clearGraphics(): Promise<{success: boolean, message: string}> {
    if (!this.graphicsLayer) {
      return { success: false, message: "Graphics layer not initialized" };
    }

    try {
      this.graphicsLayer.removeAll();
      return { success: true, message: "All graphics cleared" };
    } catch (error) {
      console.error("Error clearing graphics:", error);
      return { success: false, message: "Failed to clear graphics" };
    }
  }

  // Set map center
  async setCenter(latitude: number, longitude: number): Promise<{success: boolean, message: string}> {
    if (!this.view) {
      return { success: false, message: "Map not initialized" };
    }

    try {
      await this.view.goTo({
        center: [longitude, latitude], // ArcGIS uses [lng, lat] format
        animate: true
      });
      
      return { 
        success: true, 
        message: `Map center set to ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
      };
    } catch (error) {
      console.error("Error setting map center:", error);
      return { 
        success: false, 
        message: "Failed to set map center" 
      };
    }
  }

  // Set zoom level
  async setZoom(level: number): Promise<{success: boolean, message: string}> {
    if (!this.view) {
      return { success: false, message: "Map not initialized" };
    }

    try {
      await this.view.goTo({
        zoom: level,
        animate: true
      });
      
      return { 
        success: true, 
        message: `Map zoom set to level ${level}` 
      };
    } catch (error) {
      console.error("Error setting zoom:", error);
      return { 
        success: false, 
        message: "Failed to set zoom level" 
      };
    }
  }

  // Set both center and zoom
  async setCenterAndZoom(latitude: number, longitude: number, zoom: number): Promise<{success: boolean, message: string}> {
    if (!this.view) {
      return { success: false, message: "Map not initialized" };
    }

    try {
      await this.view.goTo({
        center: [longitude, latitude],
        zoom: zoom,
        animate: true
      });
      
      return { 
        success: true, 
        message: `Map set to ${latitude.toFixed(4)}, ${longitude.toFixed(4)} at zoom level ${zoom}` 
      };
    } catch (error) {
      console.error("Error setting map view:", error);
      return { 
        success: false, 
        message: "Failed to set map view" 
      };
    }
  }

  // Get current map state
  getCurrentState(): {center: {lat: number, lng: number}, zoom: number} | null {
    if (!this.view || !this.view.center) {
      return null;
    }

    return {
      center: {
        lat: this.view.center.latitude ?? 0,
        lng: this.view.center.longitude ?? 0
      },
      zoom: this.view.zoom ?? 1
    };
  }

  // Get user's current location using geolocation
  async getCurrentLocation(): Promise<{success: boolean, message: string, coordinates?: {lat: number, lng: number}, accuracy?: number}> {
    console.log('Checking geolocation support...')
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return {
        success: false,
        message: "Geolocation is not supported by this browser"
      };
    }

    console.log('Requesting geolocation...')
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position)
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          resolve({
            success: true,
            message: `Current location found: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
            coordinates,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.log('Geolocation error:', error)
          let message = "Unable to retrieve your location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
          }
          
          resolve({
            success: false,
            message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Center map on user's current location
  async centerOnCurrentLocation(): Promise<{success: boolean, message: string, coordinates?: {lat: number, lng: number}}> {
    const locationResult = await this.getCurrentLocation();
    
    if (!locationResult.success || !locationResult.coordinates) {
      return {
        success: false,
        message: locationResult.message
      };
    }

    const { lat, lng } = locationResult.coordinates;
    const centerResult = await this.setCenter(lat, lng);
    
    if (centerResult.success) {
      return {
        success: true,
        message: `Map centered on your current location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: { lat, lng }
      };
    } else {
      return {
        success: false,
        message: `Found your location but failed to center map: ${centerResult.message}`
      };
    }
  }

  // Add listener for map changes
  addListener(callback: (center: {lat: number, lng: number}, zoom: number) => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (center: {lat: number, lng: number}, zoom: number) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners(center: {lat: number, lng: number}, zoom: number) {
    this.listeners.forEach(listener => listener(center, zoom));
  }
}

// Export singleton instance
export const mapController = new MapController();
