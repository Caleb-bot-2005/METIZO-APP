import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Region extends Coordinate {
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapPressEvent {
  nativeEvent: { coordinate: Coordinate };
}

interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  pinColor?: string;
  children?: React.ReactNode;
}

interface PolylineProps {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
}

interface MapViewProps extends ViewProps {
  initialRegion?: Region;
  onPress?: (e: MapPressEvent) => void;
  children?: React.ReactNode;
  customMapStyle?: unknown;
}

const FALLBACK_REGION: Region = { latitude: 5.6037, longitude: -0.187, latitudeDelta: 0.02, longitudeDelta: 0.02 };
const TILE_SIZE = 256;
const TILE_URL = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// Web Mercator projection — converts lat/lon to a global pixel coordinate at a given zoom.
function lonToGlobalX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * TILE_SIZE * Math.pow(2, zoom);
}

function latToGlobalY(lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * TILE_SIZE * Math.pow(2, zoom);
}

function globalXToLon(x: number, zoom: number) {
  return (x / (TILE_SIZE * Math.pow(2, zoom))) * 360 - 180;
}

function globalYToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * Math.pow(2, zoom));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function zoomForDelta(longitudeDelta: number, width: number) {
  const zoom = Math.log2((width * 360) / (TILE_SIZE * longitudeDelta));
  return Math.min(19, Math.max(2, Math.round(zoom)));
}

function pinColorHex(pinColor?: string) {
  switch ((pinColor ?? '').toLowerCase()) {
    case '#22c55e':
    case 'green':
      return '#22C55E';
    case '#f59e0b':
    case 'orange':
      return '#F59E0B';
    default:
      return pinColor ?? '#EF4444';
  }
}

interface ExtractedMarker extends MarkerProps {
  key: string | null;
}

function extractMarkers(children: React.ReactNode): ExtractedMarker[] {
  const markers: ExtractedMarker[] = [];
  React.Children.forEach(children, (child: any) => {
    if (child?.props?.coordinate) markers.push({ key: child.key, ...child.props });
  });
  return markers;
}

export function MapView({ style, initialRegion, onPress, children }: MapViewProps) {
  const [autoRegion, setAutoRegion] = useState<Region | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (initialRegion) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setAutoRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch {
        // location unavailable — fall back to default region below
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialRegion]);

  const region = initialRegion ?? autoRegion ?? FALLBACK_REGION;
  const longitudeDelta = region.longitudeDelta ?? 0.02;
  const markers = useMemo(() => extractMarkers(children), [children]);

  const width = Math.round(size.width);
  const height = Math.round(size.height);
  const ready = width > 0 && height > 0;
  const zoom = ready ? zoomForDelta(longitudeDelta, width) : 14;

  const centerGlobalX = lonToGlobalX(region.longitude, zoom);
  const centerGlobalY = latToGlobalY(region.latitude, zoom);
  const originX = centerGlobalX - width / 2;
  const originY = centerGlobalY - height / 2;

  const tiles = useMemo(() => {
    if (!ready) return [];
    const minTileX = Math.floor(originX / TILE_SIZE);
    const maxTileX = Math.floor((originX + width) / TILE_SIZE);
    const minTileY = Math.floor(originY / TILE_SIZE);
    const maxTileY = Math.floor((originY + height) / TILE_SIZE);
    const maxIndex = Math.pow(2, zoom) - 1;
    const list: { x: number; y: number; left: number; top: number }[] = [];
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (ty < 0 || ty > maxIndex) continue;
        const wrappedX = ((tx % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
        list.push({ x: wrappedX, y: ty, left: tx * TILE_SIZE - originX, top: ty * TILE_SIZE - originY });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, originX, originY, width, height, zoom]);

  function handleLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize({ width: w, height: h });
  }

  function handleTap(e: any) {
    if (!onPress || !ready) return;
    const { locationX, locationY } = e.nativeEvent;
    const longitude = globalXToLon(originX + locationX, zoom);
    const latitude = globalYToLat(originY + locationY, zoom);
    onPress({ nativeEvent: { coordinate: { latitude, longitude } } });
  }

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#E2E8F0' }, style as ViewStyle]} onLayout={handleLayout}>
      {tiles.map((tile) => (
        <Image
          key={`${zoom}-${tile.x}-${tile.y}`}
          source={{ uri: TILE_URL(zoom, tile.x, tile.y) }}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
          contentFit="cover"
          transition={100}
        />
      ))}
      {onPress ? (
        <View style={StyleSheet.absoluteFillObject} onStartShouldSetResponder={() => true} onResponderRelease={handleTap} />
      ) : null}
      {ready &&
        markers.map((marker, index) => {
          const left = lonToGlobalX(marker.coordinate.longitude, zoom) - originX;
          const top = latToGlobalY(marker.coordinate.latitude, zoom) - originY;
          return (
            <View key={marker.key ?? index} pointerEvents="none" style={{ position: 'absolute', left: left - 16, top: top - 32, width: 32, height: 32, alignItems: 'center' }}>
              {marker.children ?? <DefaultPin color={pinColorHex(marker.pinColor)} />}
            </View>
          );
        })}
    </View>
  );
}

function DefaultPin({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: 2, borderColor: '#FFFFFF' }} />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -2,
        }}
      />
    </View>
  );
}

export function Marker(_props: MarkerProps) {
  return null;
}

export function Polyline(_props: PolylineProps) {
  return null;
}
