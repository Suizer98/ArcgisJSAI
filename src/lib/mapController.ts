// Map Controller for AI integration
import MapView from "@arcgis/core/views/MapView";

class MapController {
  private view: MapView | null = null;
  private listeners: Array<(center: {lat: number, lng: number}, zoom: number) => void> = [];

  setMapView(view: MapView) {
    this.view = view;
    
    // Watch for changes and notify listeners
    view.watch("center", (center) => {
      if (center) {
        this.notifyListeners({
          lat: center.latitude,
          lng: center.longitude
        }, view.zoom);
      }
    });

    view.watch("zoom", (zoom) => {
      if (view.center) {
        this.notifyListeners({
          lat: view.center.latitude,
          lng: view.center.longitude
        }, zoom);
      }
    });
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
        lat: this.view.center.latitude,
        lng: this.view.center.longitude
      },
      zoom: this.view.zoom
    };
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
