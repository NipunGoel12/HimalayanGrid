// Approximate real-world coordinates for each topic, used by the "real map"
// (satellite / terrain) view. The illustrated offline map keeps using
// map_x/map_y for its stylized layout — these are separate and only needed
// when plotting topics on an actual Leaflet map with satellite/terrain tiles.
//
// Coordinates are educational approximations (nearest notable place/region),
// not survey-grade positions.
export const TOPIC_COORDS = {
  "topic-everest": [27.9881, 86.925],
  "topic-kanchenjunga": [27.7025, 88.1475],
  "topic-ladakh-geo": [34.1526, 77.5771], // Leh
  "topic-brahmaputra": [28.0667, 95.3333], // near Pasighat, Arunachal Pradesh
  "topic-ganga": [30.993, 79.0819], // Gangotri, Uttarakhand
  "topic-glaciers": [32.3667, 77.25], // Rohtang area, Himachal Pradesh
  "topic-mountain-formation": [28.3949, 84.124], // central Nepal Himalaya
  "topic-climate": [27.041, 88.2663], // Darjeeling
  "topic-avalanches": [32.2432, 77.1892], // Manali, Himachal Pradesh
  "topic-snowleopard": [33.8993, 77.6335], // Hemis National Park, Ladakh
  "topic-redpanda": [27.3667, 88.7667], // Kyongnosla Alpine Sanctuary, Sikkim
  "topic-monal": [30.728, 79.607], // Nanda Devi Biosphere, Uttarakhand
  "topic-ghnp": [31.75, 77.5833], // Great Himalayan National Park, HP
  "topic-valleyofflowers": [30.728, 79.607], // Uttarakhand
  "topic-silkroute": [34.68, 77.56], // Nubra Valley, Ladakh
  "topic-rumtek": [27.2833, 88.5667], // Rumtek Monastery, Sikkim
  "topic-sikkimculture": [27.3389, 88.6065], // Gangtok, Sikkim
  "topic-hemis": [33.8985, 77.632], // Hemis Monastery, Ladakh
  "topic-hanle": [32.7794, 78.9642], // Hanle, Ladakh
  "topic-satellite": [27.7167, 88.55], // Lachen, North Sikkim
};

// Center of the Himalayan region for the real map's initial view.
export const HIMALAYA_CENTER = [29.5, 84.5];
export const HIMALAYA_DEFAULT_ZOOM = 6;
