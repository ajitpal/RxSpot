import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { PharmacyWithStatus, Medication, UserLocation } from '@/types';

interface MapViewProps {
  pharmacies: PharmacyWithStatus[];
  selectedMedication: Medication | null;
  userLocation: UserLocation | null;
  onPharmacySelect: (pharmacy: PharmacyWithStatus) => void;
}

// Web-specific map component
function WebMapView({ pharmacies, selectedMedication, userLocation, onPharmacySelect }: MapViewProps) {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [DivIcon, setDivIcon] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dynamically import react-leaflet components
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([reactLeaflet, L]) => {
      // Set default icon path for Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setMapContainer(() => reactLeaflet.MapContainer);
      setTileLayer(() => reactLeaflet.TileLayer);
      setMarker(() => reactLeaflet.Marker);
      setPopup(() => reactLeaflet.Popup);
      setDivIcon(() => L.divIcon);
      setIsReady(true);
    }).catch((error) => {
      console.error('Failed to load map components:', error);
    });
  }, []);

  if (!isReady || !MapContainer || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Create user location icon
  const userIcon = DivIcon({
    className: 'user-location-marker',
    html: `<div style="width: 20px; height: 20px; background: #0066CC; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>Your Location</Popup>
        </Marker>

        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy, index) => {
          const status = pharmacy.status || 'unknown';
          const confidence = pharmacy.confidence || 0;
          
          let color = '#9ca3af'; // gray for unknown
          if (status === 'in_stock' && confidence > 0.3) color = '#10B981'; // green
          if (status === 'out_of_stock' && confidence > 0.3) color = '#EF4444'; // red

          const markerIcon = DivIcon({
            className: 'pharmacy-marker',
            html: `
              <div style="
                width: 24px; 
                height: 24px; 
                background: ${color}; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.2s ease;
              " 
              onmouseover="this.style.transform='scale(1.2)'" 
              onmouseout="this.style.transform='scale(1)'">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          return (
            <Marker
              key={`pharmacy-${index}`}
              position={[pharmacy.lat, pharmacy.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onPharmacySelect(pharmacy)
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
                    {pharmacy.name}
                  </h3>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                    {pharmacy.address}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#0066CC' }}>
                    Click to report stock status
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function MapView({ pharmacies, selectedMedication, userLocation, onPharmacySelect }: MapViewProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <WebMapView
          pharmacies={pharmacies}
          selectedMedication={selectedMedication}
          userLocation={userLocation}
          onPharmacySelect={onPharmacySelect}
        />
      </View>
    );
  }

  // Fallback for native platforms
  return (
    <View style={styles.fallback}>
      <View style={styles.fallbackTextContainer}>
        <Text style={styles.fallbackText}>Map view requires web platform</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  fallbackTextContainer: {
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});