'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
// Явно импортируем стили Leaflet и иконки
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import { useRouter } from 'next/navigation';

// Необходимый хак для корректной работы иконок Leaflet в Next.js
// Мы выполняем эту проверку только в браузере
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

// Компонент обработки событий карты
function MapEvents({ 
  onMapClick 
}: { 
  onMapClick: (position: { lat: number; lng: number }) => void 
}) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  
  return null;
}

// Компонент для установки фокуса карты
function MapFocus({ 
  position, 
  zoom = 13
}: { 
  position: { lat: number; lng: number }; 
  zoom?: number; 
}) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([position.lat, position.lng], zoom);
  }, [map, position, zoom]);
  
  return null;
}

// Типы для событий рыбалки
export interface FishingEvent {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  startDate: Date;
  endDate?: Date;
  fishTypes?: string;
  weather?: string;
}

interface FishingMapProps {
  events?: FishingEvent[];
  onEventCreate: (position: { lat: number; lng: number }) => void;
  onEventSelect?: (eventId: string) => void;
  focusPosition?: { lat: number; lng: number; zoom?: number };
  focusEventId?: string;
}

export function FishingMap({ 
  events = [], 
  onEventCreate, 
  onEventSelect,
  focusPosition, 
  focusEventId 
}: FishingMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<any>(null);
  const prevEventsLength = useRef<number>(0);
  const prevFocusEventId = useRef<string | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Центр карты (координаты центра Беларуси)
  const defaultCenter: [number, number] = [53.9, 27.5667]; // Минск, центр Беларуси
  
  // Инициализация компонента
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Добавляем стили для более заметного попапа
  useEffect(() => {
    if (!isMounted) return;
    
    // Переопределяем стили для попапов Leaflet
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-popup-content-wrapper {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      .leaflet-popup-content {
        margin: 12px 16px;
        min-width: 200px;
      }
      .highlighted-popup .leaflet-popup-content-wrapper {
        background: rgba(255, 250, 240, 0.98);
        border: 2px solid #f97316;
      }
      .highlighted-popup .leaflet-popup-tip {
        border-top-color: #f97316;
      }
      
      /* Стиль для выделенного события */
      .highlighted-marker {
        filter: hue-rotate(140deg) saturate(1.5);
        z-index: 1000 !important;
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isMounted]);
  
  // Очистка выделения маркеров
  const clearHighlightedMarkers = () => {
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    markers.forEach(marker => {
      marker.classList.remove('highlighted-marker');
    });
  };
  
  // Фокусировка на выбранном событии по ID
  useEffect(() => {
    if (!isMounted || !mapRef.current) return;
    
    // Если количество событий увеличилось и у нас есть ID события для фокуса,
    // это скорее всего означает, что было создано новое событие
    const isNewEventAdded = events.length > prevEventsLength.current;
    
    // Обновляем счетчик событий для следующего сравнения
    prevEventsLength.current = events.length;
    
    if (focusEventId && (isNewEventAdded || focusEventId !== prevFocusEventId.current)) {
      // Обновляем ID текущего события для сравнения в будущем
      prevFocusEventId.current = focusEventId;
      
      // Находим событие по ID
      const eventToFocus = events.find(e => e.id === focusEventId);
      
      if (eventToFocus) {
        // Очищаем предыдущие выделения
        clearHighlightedMarkers();
        
        // Простое центрирование без сложных смещений
        setTimeout(() => {
          // Центрируем карту на событии
          mapRef.current.setView(
            [eventToFocus.latitude, eventToFocus.longitude], 
            10, // Используем масштаб 10 для отображения события и окружающей территории
            { animate: false }
          );
          
          // Выделяем маркер и открываем попап с небольшой задержкой
          setTimeout(() => {
            // Найдем маркер, соответствующий выбранному событию
            const eventId = focusEventId;
            const event = events.find(e => e.id === eventId);
            
            if (event) {
              // Ищем маркер по координатам события
              const markerElements = document.querySelectorAll('.leaflet-marker-icon');
              let foundMarker: HTMLElement | null = null;
              
              // Перебираем все маркеры и ищем тот, который соответствует координатам события
              Array.from(markerElements).forEach((marker) => {
                const style = (marker as HTMLElement).style;
                const transform = style.transform || '';
                
                // Проверяем, что маркер не имеет класса выделения
                if (!marker.classList.contains('highlighted-marker')) {
                  // Получаем координаты маркера через клик и проверяем, открывается ли нужный попап
                  const markerElement = marker as HTMLElement;
                  
                  // Создаем временный обработчик для проверки попапа
                  const tempHandler = (e: MouseEvent) => {
                    // Проверяем содержимое попапа после его открытия
                    setTimeout(() => {
                      const popups = document.querySelectorAll('.leaflet-popup-content');
                      popups.forEach(popup => {
                        if (popup.textContent?.includes(event.title)) {
                          foundMarker = markerElement;
                          markerElement.classList.add('highlighted-marker');
                          
                          // Удаляем временный обработчик
                          markerElement.removeEventListener('click', tempHandler);
                          
                          // Симулируем клик для открытия попапа
                          markerElement.click();
                        }
                      });
                    }, 50);
                  };
                  
                  // Добавляем временный обработчик
                  markerElement.addEventListener('click', tempHandler, { once: true });
                  
                  // Симулируем клик для проверки
                  markerElement.click();
                  
                  // Если нашли нужный маркер, прерываем поиск
                  if (foundMarker) {
                    return;
                  }
                }
              });
            }
          }, 300);
        }, 100);
      }
    }
  }, [events, focusEventId, isMounted]);
  
  // Фокусировка по координатам из URL
  useEffect(() => {
    if (isMounted && mapRef.current && focusPosition) {
      mapRef.current.setView(
        [focusPosition.lat, focusPosition.lng], 
        focusPosition.zoom || 7 // Используем масштаб 7 по умолчанию для Беларуси
      );
    }
  }, [focusPosition, isMounted]);
  
  // Обработка изменения размера карты при выборе события
  useEffect(() => {
    if (!isMounted || !mapRef.current || !mapContainerRef.current) return;
    
    // Инвалидируем размер карты при изменении размера контейнера
    const invalidateMapSize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    
    // Если focusEventId стал null, значит панель деталей была закрыта
    // и нужно обновить размер карты
    if (prevFocusEventId.current && !focusEventId) {
      // Обновляем ссылку на предыдущее значение
      prevFocusEventId.current = focusEventId;
      
      // Вызываем инвалидацию размера несколько раз с разной задержкой
      // для надежности обновления после завершения анимации
      setTimeout(invalidateMapSize, 100);
      setTimeout(invalidateMapSize, 300);
      setTimeout(invalidateMapSize, 500);
    } else {
      // Обновляем ссылку на предыдущее значение
      prevFocusEventId.current = focusEventId;
      
      // Вызываем инвалидацию размера с небольшой задержкой
      setTimeout(invalidateMapSize, 100);
      setTimeout(invalidateMapSize, 300);
      setTimeout(invalidateMapSize, 500);
    }
    
    // Добавляем обработчик изменения размера окна
    const handleResize = () => {
      setTimeout(invalidateMapSize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMounted, focusEventId]);
  
  const handleMapClick = (position: { lat: number; lng: number }) => {
    onEventCreate(position);
  };
  
  // Перемещение к маркеру и вызов обработчика выбора события
  const handleMarkerFocus = (lat: number, lng: number, eventId: string) => {
    // Центрируем карту на маркере
    mapRef.current?.setView([lat, lng], 10, { animate: false }); // Используем масштаб 10 для отображения события и окружающей территории
    
    // Очищаем все выделения маркеров
    clearHighlightedMarkers();
    
    // Находим элемент маркера по координатам и выделяем его
    setTimeout(() => {
      const markerElements = document.querySelectorAll('.leaflet-marker-icon');
      const event = events.find(e => e.id === eventId);
      
      if (event) {
        markerElements.forEach((marker) => {
          const markerElement = marker as HTMLElement;
          const style = markerElement.style;
          const transform = style.transform || '';
          
          // Проверяем, что попап содержит название события
          const popups = document.querySelectorAll('.leaflet-popup-content');
          popups.forEach(popup => {
            if (popup.textContent?.includes(event.title)) {
              markerElement.classList.add('highlighted-marker');
            }
          });
        });
      }
    }, 100);
    
    // Вызываем обработчик выбора события, если он предоставлен
    if (onEventSelect) {
      onEventSelect(eventId);
    }
  };
  
  // Переход на страницу события
  const handleViewEvent = (eventId: string) => {
    router.push(`/fishing/${eventId}`);
  };
  
  if (!isMounted) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <p>Загрузка карты...</p>
      </div>
    );
  }
  
  return (
    <div className="relative h-full" ref={mapContainerRef}>
      <div className="h-full w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={defaultCenter}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEvents onMapClick={handleMapClick} />
          
          {/* Компонент для установки фокуса по координатам из URL */}
          {focusPosition && (
            <MapFocus 
              position={{ lat: focusPosition.lat, lng: focusPosition.lng }}
              zoom={focusPosition.zoom || 7} // Используем масштаб 7 по умолчанию для Беларуси
            />
          )}
          
          {events.map((event) => (
            <Marker 
              key={event.id} 
              position={[event.latitude, event.longitude]}
              eventHandlers={{
                click: () => handleMarkerFocus(event.latitude, event.longitude, event.id),
              }}
            >
              <Popup className={event.id === focusEventId ? 'highlighted-popup' : ''}>
                <div className="p-2">
                  <h3 className="font-semibold text-base">{event.title}</h3>
                  <div className="mt-2">
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEvent(event.id);
                      }}
                      className="w-full"
                    >
                      Открыть страницу
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md z-[1000] text-xs">
        <p className="font-medium">Нажмите на карту, чтобы создать новое событие</p>
      </div>
    </div>
  );
} 