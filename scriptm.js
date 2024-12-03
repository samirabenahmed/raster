// Initialiser la carte avec OpenStreetMap (à remplacer par Esri ou autre fond de carte personnalisé)
const map = L.map('map').setView([25.0, -7.0], 5);  // Centrer sur le Maroc/Sahara

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© Esri, DeLorme, NAVTEQ',
  maxZoom: 18,
}).addTo(map);

let sideBySideControl; // Variable pour stocker le contrôle du slider

// Fonction pour charger un fichier GeoTIFF
function loadGeoRaster(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => parseGeoraster(arrayBuffer))
      .then(resolve)
      .catch(reject);
  });
}

// Fonction pour afficher les images dans la carte en fonction de la sélection de la région
function loadImagesForRegion(region) {
  let imageUrls = {
    region1: ['./a.tif', './b.tif'],
    region2: ['./aa.tif', './bb.tif'],
    region3: ['./aaa.tif', './bbb.tif'], // Nouvelle région aaa, bbb
  };

  // Vider les anciennes couches de la carte
  map.eachLayer(layer => {
    if (layer instanceof GeoRasterLayer) {
      map.removeLayer(layer);
    }
  });

  // Supprimer le contrôleur slider précédent si existe
  if (sideBySideControl) {
    map.removeControl(sideBySideControl);
  }

  // Charger les images de la région sélectionnée
  Promise.all([
    loadGeoRaster(imageUrls[region][0]),
    loadGeoRaster(imageUrls[region][1])
  ]).then(([raster1, raster2]) => {
    const layer1 = new GeoRasterLayer({
      georaster: raster1,
      band: [3, 2, 1],
      opacity: 1,
      resolution: 256,
    });

    const layer2 = new GeoRasterLayer({
      georaster: raster2,
      band: [3, 2, 1],
      opacity: 1,
      resolution: 256,
    });

    // Ajouter les nouvelles couches à la carte
    layer1.addTo(map);
    layer2.addTo(map);

    // Ajuster la carte pour inclure les deux images
    const bounds = layer1.getBounds();
    map.fitBounds(bounds);

    // Créer un slider side-by-side pour comparer les deux images
    sideBySideControl = L.control.sideBySide(layer1, layer2).addTo(map);

    // Désactiver le déplacement de la carte pendant l'interaction avec le slider
    const slider = sideBySideControl._slider;

    slider.addEventListener('mousedown', () => {
      map.dragging.disable(); // Désactiver le déplacement de la carte
    });

    slider.addEventListener('touchstart', () => {
      map.dragging.disable(); // Désactiver pour les appareils tactiles
    });

    // Réactiver le déplacement de la carte après l'interaction avec le slider
    document.addEventListener('mouseup', () => {
      map.dragging.enable(); // Réactiver le déplacement de la carte
    });

    document.addEventListener('touchend', () => {
      map.dragging.enable(); // Réactiver pour les appareils tactiles
    });
  }).catch(error => {
    console.error('Erreur lors du chargement des fichiers GeoTIFF :', error);
  });
}

// Charger la région par défaut (region1)
loadImagesForRegion('region1');

// Changer de région lorsque l'utilisateur sélectionne une autre option
const regionSelect = document.getElementById('regionSelect');
regionSelect.addEventListener('change', function() {
  const selectedRegion = regionSelect.value;
  loadImagesForRegion(selectedRegion);
});
