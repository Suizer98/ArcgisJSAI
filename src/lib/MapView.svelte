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
  }
</script>

<div class="view" use:createMap></div>

<style>
  .view {
    height: 100%;
    width: 100%;
  }
</style>
