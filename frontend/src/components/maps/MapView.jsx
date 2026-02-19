/**
 * FoodLink Campus - Map View Component
 * Supports Google Maps API with graceful mock fallback
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Locate, AlertCircle } from 'lucide-react';

// Check if Google Maps API key is configured
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Mock Map Component - Used when Google Maps API is not available
 */
function MockMapView({ items = [], onItemClick, selectedItems = [], mockReason = "" }) {
    return (
        <div className="relative bg-gradient-to-br from-charity-50 to-charity-100 rounded-2xl overflow-hidden border border-charity-200">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-30">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path
                                d="M 50 0 L 0 0 0 50"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-charity-300"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid)" />
                </svg>
            </div>

            {/* Map Content */}
            <div className="relative h-96 p-4">
                {items.length > 0 ? (
                    <>
                        {/* Simulated Road Lines */}
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                            viewBox="0 0 400 300"
                        >
                            <path
                                d="M 50 150 Q 150 100 200 150 T 350 150"
                                fill="none"
                                stroke="#9CA3AF"
                                strokeWidth="3"
                                strokeDasharray="10,5"
                            />
                            <path
                                d="M 200 50 Q 200 150 200 250"
                                fill="none"
                                stroke="#9CA3AF"
                                strokeWidth="3"
                                strokeDasharray="10,5"
                            />
                        </svg>

                        {/* Location Pins */}
                        {items.map((item, index) => {
                            // Distribute pins in a realistic pattern
                            const angle = (index * 137.5) * (Math.PI / 180); // Golden angle
                            const radius = 30 + (index % 3) * 25;
                            const centerX = 50;
                            const centerY = 50;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle) * 0.6; // Flatten for perspective

                            const isSelected = selectedItems.includes(item.id);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onItemClick?.(item)}
                                    className="absolute transform -translate-x-1/2 -translate-y-full group"
                                    style={{
                                        left: `${Math.min(90, Math.max(10, x))}%`,
                                        top: `${Math.min(85, Math.max(15, y))}%`
                                    }}
                                >
                                    {/* Pin */}
                                    <div className={`
                    relative transition-transform duration-200
                    ${isSelected ? 'scale-125' : 'group-hover:scale-110'}
                  `}>
                                        <div className={`
                      w-10 h-10 rounded-full shadow-lg
                      flex items-center justify-center
                      font-bold text-white text-sm
                      ${isSelected
                                                ? 'bg-charity-600 ring-4 ring-charity-300'
                                                : 'bg-charity-500 group-hover:bg-charity-600'
                                            }
                    `}>
                                            {index + 1}
                                        </div>
                                        {/* Pin Tail */}
                                        <div className={`
                      absolute left-1/2 -translate-x-1/2 -bottom-1
                      w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px]
                      border-l-transparent border-r-transparent
                      ${isSelected ? 'border-t-charity-600' : 'border-t-charity-500'}
                    `} />

                                        {/* Pulse Animation for Selected */}
                                        {isSelected && (
                                            <div className="absolute inset-0 rounded-full bg-charity-500 animate-ping opacity-30" />
                                        )}
                                    </div>

                                    {/* Tooltip */}
                                    <div className="
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                    opacity-0 group-hover:opacity-100 transition-opacity
                    pointer-events-none z-10
                  ">
                                        <div className="bg-white rounded-lg shadow-xl p-3 text-left min-w-[160px] border border-surface-100">
                                            <p className="font-semibold text-surface-900 text-sm line-clamp-1">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-surface-500 mt-0.5">
                                                {item.location_name || 'Campus Location'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-charity-600">
                                                <MapPin className="w-3 h-3" />
                                                {item.quantity} {item.unit}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-charity-600">
                            <MapPin className="w-16 h-16 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No pickup locations</p>
                            <p className="text-sm opacity-70">Food items will appear here</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 text-sm">
                <div className="flex items-center gap-2 text-surface-700">
                    <div className="w-4 h-4 bg-charity-500 rounded-full" />
                    <span>Pickup Location</span>
                </div>
            </div>

            {/* API Key Notice */}
            <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Mock Map - {mockReason || "Configure VITE_GOOGLE_MAPS_API_KEY"}</span>
            </div>

            {/* Zoom Controls (non-functional in mock) */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-surface-600 hover:bg-surface-50">
                    +
                </button>
                <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-surface-600 hover:bg-surface-50">
                    −
                </button>
            </div>
        </div>
    );
}

/**
 * Google Maps Component - Used when API key is available
 */
function GoogleMapView({ items = [], onItemClick, selectedItems = [] }) {
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeError, setRouteError] = useState(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);
    const directionsRendererRef = useRef(null);

    // 1. Load Google Maps Script
    useEffect(() => {
        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);
    }, []);

    // 2. Get User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Error getting location:", error)
            );
        }
    }, []);

    // 3. Initialize Map & Directions Renderer
    useEffect(() => {
        if (!isLoaded || !window.google?.maps || mapInstance) return;

        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        const initialCenter = userLocation || { lat: 12.9716, lng: 77.5946 }; // Default Bangalore

        const newMap = new window.google.maps.Map(mapElement, {
            center: initialCenter,
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
        });

        // Initialize Directions Renderer
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: newMap,
            suppressMarkers: true, // We use custom markers
            polylineOptions: {
                strokeColor: "#4F46E5", // Indigo-600
                strokeWeight: 6,
                strokeOpacity: 0.8
            }
        });

        setMapInstance(newMap);
    }, [isLoaded, userLocation]); // Init once location is known (or default)

    // 4. Update Markers, User Location & Calculate Route
    useEffect(() => {
        if (!mapInstance || !window.google?.maps) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();
        const validItems = [];

        // Add User Location Marker
        if (userLocation) {
            if (userMarkerRef.current) userMarkerRef.current.setMap(null);

            userMarkerRef.current = new window.google.maps.Marker({
                position: userLocation,
                map: mapInstance,
                title: "You are here",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
                zIndex: 999
            });
            bounds.extend(userLocation);
        }

        // Add Item Markers
        items.forEach((item, index) => {
            if (item.latitude && item.longitude) {
                const position = {
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude)
                };
                validItems.push({ ...item, position });

                const marker = new window.google.maps.Marker({
                    position: position,
                    map: mapInstance,
                    title: item.name,
                    label: {
                        text: String(index + 1),
                        color: 'white',
                    },
                });

                marker.addListener('click', () => onItemClick?.(item));

                markersRef.current.push(marker);
                bounds.extend(position);
            }
        });

        // Fit bounds
        if (validItems.length > 0 || userLocation) {
            mapInstance.fitBounds(bounds);
            const listener = window.google.maps.event.addListenerOnce(mapInstance, "bounds_changed", () => {
                if (mapInstance.getZoom() > 16) mapInstance.setZoom(16);
            });
        }

        // Calculate Route
        if (userLocation && validItems.length > 0) {
            const directionsService = new window.google.maps.DirectionsService();
            const destination = validItems[validItems.length - 1].position;
            const waypoints = validItems.slice(0, -1).map(item => ({
                location: item.position,
                stopover: true
            }));

            directionsService.route({
                origin: userLocation,
                destination: destination,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === 'OK' && directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);

                    const leg = result.routes[0].legs[0];
                    setRouteInfo({
                        distance: leg.distance.text,
                        duration: leg.duration.text
                    });
                    setRouteError(null);
                } else {
                    console.error("Directions failed:", status);
                    setRouteInfo(null);
                    setRouteError(status);
                    if (directionsRendererRef.current) directionsRendererRef.current.setDirections({ routes: [] });
                }
            });
        } else {
            setRouteInfo(null);
            if (directionsRendererRef.current) directionsRendererRef.current.setDirections({ routes: [] });
        }

    }, [mapInstance, items, userLocation]);

    const hasInvalidItems = items.some(i => !i.latitude || !i.longitude);

    if (!isLoaded) {
        return (
            <div className="h-96 bg-surface-100 rounded-2xl flex items-center justify-center animate-pulse">
                <div className="text-surface-400 font-medium">Loading Map...</div>
            </div>
        );
    }

    return (
        <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-surface-200 shadow-sm">
            <div id="google-map" className="h-full w-full" />

            {/* Route Info Overlay */}
            {routeInfo && (
                <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur shadow-lg rounded-xl p-4 border border-surface-200 min-w-[200px]">
                    <h3 className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-indigo-600" />
                        Route Details
                    </h3>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Distance:</span>
                            <span className="font-bold text-surface-900">{routeInfo.distance}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Time:</span>
                            <span className="font-bold text-surface-900">{routeInfo.duration}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {routeError && (
                <div className="absolute top-4 left-4 z-10 bg-red-50 shadow-lg rounded-xl p-3 border border-red-200 max-w-xs">
                    <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Route Unavailable</p>
                            <p className="text-xs mt-1">
                                Google Maps Error: {routeError}.
                                {routeError === 'REQUEST_DENIED' && " Enable Directions API in Google Cloud."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Missing GPS Warning */}
            {hasInvalidItems && !routeError && (
                <div className="absolute bottom-4 left-4 right-4 bg-amber-50/90 backdrop-blur border border-amber-200 p-2 rounded-lg flex items-center gap-2 text-xs text-amber-800 z-10 justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Some items lack GPS coordinates.</span>
                </div>
            )}
        </div>
    );
}

/**
 * Main MapView Component
 * Automatically chooses between Google Maps and Mock based on API key
 */
export default function MapView({ items = [], onItemClick, selectedItems = [] }) {
    // Use mock if no API key configured
    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <MockMapView
                items={items}
                onItemClick={onItemClick}
                selectedItems={selectedItems}
                mockReason="No API Key"
            />
        );
    }

    return (
        <GoogleMapView
            items={items}
            onItemClick={onItemClick}
            selectedItems={selectedItems}
        />
    );
}
