<script lang="ts">
  import MapView from "@arcgis/core/views/MapView";
  import "@arcgis/core/assets/esri/themes/light/main.css";
  import { mapController } from './mapController';

  let view: MapView;

  const createMap = (domNode: HTMLElement) => {
    view = new MapView({
      container: domNode,
      map: {
        basemap: "streets-vector",
      },
      zoom: 11,
      center: [103.8198, 1.3521],
    })

    // Register the map view with the controller
    mapController.setMapView(view);

    // Add coordinate display widget
    addCoordinateWidget();
  }

  function addCoordinateWidget() {
    // Create a simple coordinate display widget
    const coordinateWidget = document.createElement("div");
    coordinateWidget.className = "esri-widget esri-coordinate-widget";
    coordinateWidget.style.cssText = `
      position: absolute;
      bottom: 50px;
      left: 20px;
      background: white;
      padding: 6px 10px;
      border-radius: 2px;
      font-size: 11px;
      color: #323232;
      border: 1px solid #d0d0d0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      z-index: 1000;
      font-family: Arial, sans-serif;
      min-width: 150px;
      line-height: 1.3;
    `;

    // Update coordinates when map moves
    view.watch("center", (center) => {
      if (center) {
        coordinateWidget.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 2px; color: #323232; font-size: 12px;">Center</div>
          <div style="margin-bottom: 1px;"><span style="color: #666;">Lon:</span> ${center.longitude.toFixed(6)}</div>
          <div><span style="color: #666;">Lat:</span> ${center.latitude.toFixed(6)}</div>
        `;
      }
    });

    // Add to map container
    view.container.appendChild(coordinateWidget);
  }
</script>

<div class="view" use:createMap></div>

<style>
  .view {
    height: 100%;
    width: 100%;
  }
</style>
