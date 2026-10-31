'use client';

import * as React from 'react';
import { GWALIOR_REPRESENTATIVE_WARDS } from '@/features/swachh/constants';
import { MapPin, Info, AlertCircle } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';

function subscribe() {
  return () => {};
}

export function GwaliorWardMap() {
  const isClient = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [selectedWard, setSelectedWard] = React.useState<number>(24);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<LeafletMap | null>(null);

  React.useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isDestroyed = false;

    // Dynamically load Leaflet client-side
    import('leaflet').then((L) => {
      if (isDestroyed || !mapContainerRef.current) return;

      // Ensure CSS is included
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default marker icon assets without any
      const defaultIconProto = L.Icon.Default.prototype as unknown as {
        _getIconUrl?: () => string;
      };
      delete defaultIconProto._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Avoid double initialization
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      // Initialize Gwalior center map
      const map = L.map(mapContainerRef.current, {
        center: [26.2183, 78.1828],
        zoom: 12,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add markers for representative demonstration zones
      GWALIOR_REPRESENTATIVE_WARDS.forEach((w) => {
        const marker = L.marker([w.latitude, w.longitude]).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="color: #1e3a8a;">${w.wardName}</strong><br/>
            <span>Sector: ${w.zone}</span><br/>
            <span style="color: #b45309; font-size: 11px;">Demonstration Zone (Unverified Boundary)</span><br/>
            <span style="color: #0284c7; font-size: 11px;">GMC Central: 0751-2438300</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedWard(w.wardNumber);
        });
      });
    });

    return () => {
      isDestroyed = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isClient]);

  const activeWardData =
    GWALIOR_REPRESENTATIVE_WARDS.find((w) => w.wardNumber === selectedWard) ||
    GWALIOR_REPRESENTATIVE_WARDS[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-700" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Gwalior Demonstration Sanitation Map (Academic Preview)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            OpenStreetMap view of approximate demonstration zones (Unverified official boundaries)
          </p>
        </div>

        {/* Selected Demonstration Zone Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          <span>Active Focus:</span>
          <span>{activeWardData.wardName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4">
        {/* Map Container */}
        <div className="lg:col-span-3 h-80 sm:h-96 w-full relative bg-slate-100">
          {!isClient && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Loading OpenStreetMap tiles for Gwalior...
            </div>
          )}
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* Demonstration Zone Info Sidebar */}
        <div className="p-4 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Demonstration Sector Details
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-400">Sector Designation</p>
              <p className="text-sm font-bold text-slate-800">{activeWardData.wardName}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Demonstration Zone</p>
              <p className="text-xs font-semibold text-blue-800">{activeWardData.zone}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Field Supervisor</p>
              <p className="text-xs font-medium text-slate-600">
                {activeWardData.supervisorName}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Municipal Helpline</p>
              <p className="text-xs font-medium text-slate-600">
                {activeWardData.supervisorContact}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 flex items-start gap-1 leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Academic Demarcation:</strong> Sector pins represent landmark approximations
                for evaluation. The live database contains 59 provisional Gwalior ward records pending
                official municipal boundary and roster verification.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
