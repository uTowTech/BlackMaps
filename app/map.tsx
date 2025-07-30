import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import landmarks from '../data/landmarks.json';

export default function MapScreen() {
  const [region, setRegion] = useState(null as any);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed for this app.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const coords = loc.coords;
      setLocation(coords);
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 15,
        longitudeDelta: 15,
      });

      const nearby = landmarks.filter(site => {
        const dist = getDistance(coords.latitude, coords.longitude, site.latitude, site.longitude);
        return dist <= 96.5; // 60 miles
      });

      if (nearby.length > 0) {
        const messages = nearby
          .map(site => `\u2022 ${site.name} (${site.location})\n${site.description}`)
          .join('\n\n');
        Alert.alert('Black History Nearby', messages);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {region && (
        <MapView style={styles.map} region={region} showsUserLocation={true}>
          {landmarks.map((site, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: site.latitude, longitude: site.longitude }}
              title={site.name}
              description={site.description}
              pinColor="#ff3333"
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  map: {
    flex: 1,
  },
});

