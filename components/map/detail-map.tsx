'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Исправление проблемы с иконками Leaflet в Next.js
const fixLeafletIcon = () => {
  // Переопределяем путь к маркеру по умолчанию
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

interface DetailMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function DetailMap({ latitude, longitude, title }: DetailMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Координаты центра Беларуси (для использования по умолчанию)
  const defaultCenter: [number, number] = [53.9, 27.5667]; // Минск, центр Беларуси
  const defaultZoom = 7; // Зум для отображения большей части Беларуси
  
  useEffect(() => {
    setIsMounted(true);
    fixLeafletIcon();
  }, []);
  
  if (!isMounted) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <p>Загрузка карты...</p>
      </div>
    );
  }
  
  // Используем переданные координаты или центр Беларуси по умолчанию
  const center: [number, number] = [
    latitude || defaultCenter[0],
    longitude || defaultCenter[1]
  ];
  
  return (
    <MapContainer
      center={center}
      zoom={latitude && longitude ? 13 : defaultZoom} // Если есть координаты - приближаем, иначе показываем общий вид
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {latitude && longitude && (
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{title}</h3>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
} 