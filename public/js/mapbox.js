export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoicGtpaHVzbmFpbjIyMCIsImEiOiJjbG94OW9neTIxNGhzMmtudnp4dTdyNmpoIn0._uyJCRJzqRO0Vr4CeCqCpQ';

    const map = new mapboxgl.Map({
        container: 'map', // container ID
        // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
        scrollZoom: false,
    });

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        //Add popup
        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} ${loc.description}<p/>`)
            .addTo(map);
        // Add map bound to include current location
        bounds.extend(loc.coordinates);
    });
    // Set the map view to fit all markers on screen
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
