<script lang="ts">
  import MapView from "@arcgis/core/views/MapView";
  import "@arcgis/core/assets/esri/themes/light/main.css";

  export let centerText: string = ""

  const createMap = (domNode: HTMLElement) => {
    const view = new MapView({
      container: domNode,
      map: {
        basemap: "streets-vector",
      },
      zoom: 15,
      center: [-90.1928, 38.6226], // longitude, latitude
    })

    // Watch for center changes and update the text
    view.watch("center", (center) => {
      if (center) {
        centerText = `Center: ${center.longitude.toFixed(4)}, ${center.latitude.toFixed(4)}`
      }
    })
  }
</script>

<div class="view" use:createMap></div>

{#if centerText}
  <p>{centerText}</p>
{/if}

<style>
  .view {
    height: 100%;
    width: 100%;
  }

  p {
    position: absolute;
    bottom: 10px;
    left: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 5px 10px;
    border-radius: 4px;
    color: #666;
    font-size: 14px;
    z-index: 1000;
  }
</style>
