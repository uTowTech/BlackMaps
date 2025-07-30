import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import landmarks from '../../assets/data/landmarks.json';

interface Landmark {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
}

export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow location access to use the map.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 50 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setRegion((r) =>
            r
              ? { ...r, latitude, longitude }
              : { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          );
          checkProximity(latitude, longitude);
        }
      );
    })();
  }, []);

  const checkProximity = (lat: number, lon: number) => {
    landmarks.forEach((lm: Landmark) => {
      if (!notifiedIds.has(lm.id)) {
        const distance = getDistance(lat, lon, lm.latitude, lm.longitude);
        if (distance < 200) {
          setNotifiedIds((prev) => new Set(prev).add(lm.id));
          Alert.alert('Nearby Landmark', `You\'re near ${lm.name}`);
        }
      }
    });
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 - Math.cos(dLat) / 2 +
      (Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        (1 - Math.cos(dLon))) /
        2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  if (!region) {
    return null;
  }

  return (
    <MapView style={styles.map} region={region} showsUserLocation>
      {(landmarks as Landmark[]).map((lm) => (
        <Marker
          key={lm.id}
          coordinate={{ latitude: lm.latitude, longitude: lm.longitude }}
          title={lm.name}
          description={lm.description}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

