// Define the map bounds in coordinates
const imageBounds = [[0, 0], [3000, 5000]];

// Initialize the map
const map = L.map('map', {
    crs: L.CRS.Simple,
    maxZoom: 2,
    minZoom: -2
});

// Set the view to fit the image bounds
map.fitBounds(imageBounds);

// Add the custom map image
L.imageOverlay('images/nr.png', imageBounds).addTo(map);

// Add the map click listener to display coordinates
map.on('click', function (e) {
    const lat = e.latlng.lat.toFixed(2); // Latitude
    const lng = e.latlng.lng.toFixed(2); // Longitude

    // Display coordinates in the <div> with id "coords"
    document.getElementById('coords').textContent = `Clicked Coordinates: Latitude: ${lat}, Longitude: ${lng}`;
});

// Add pinpoints with click navigation
const points = [
    { coords: [200, 300], title: "Oak Tree", url: "/oak", image: "images/oak.png" },
    { coords: [1173.75, 544], title: "Pond", url: "/pond", image: "images/pond.png" },
    { coords: [1965.75, 2128], title: "Mushroom Grove"}
];

points.forEach(point => {
    const marker = L.marker(point.coords).addTo(map)
        .bindTooltip(`<b>${point.title}</b><br><img src='${point.image}' width='100'>`, { permanent: false });

    marker.on('click', function() {
        window.location.href = point.url; // Redirect to the specified URL on click
    });
});
