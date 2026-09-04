import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { JournalLocation } from '../types';

interface LocationPickerProps {
  location?: JournalLocation | null;
  onUpdateLocation: (location: JournalLocation | null) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onUpdateLocation,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(location?.name || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Request browser geolocation ONLY on explicit user click
  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Validation bounds
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setErrorMsg('Invalid coordinates retrieved.');
          setIsLocating(false);
          return;
        }

        const newLoc: JournalLocation = {
          latitude: Number(lat.toFixed(5)),
          longitude: Number(lng.toFixed(5)),
          name: customName.trim() || 'Current Location',
          formattedAddress: null,
          placeId: null,
        };

        onUpdateLocation(newLoc);
        setIsLocating(false);
        setIsEditing(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. You can still type a place name manually.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg('Location information is unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg('Location request timed out.');
        } else {
          setErrorMsg('Unable to retrieve location.');
        }
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      }
    );
  };

  const handleSaveCustomName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      return;
    }

    const updated: JournalLocation = {
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      name: customName.trim().slice(0, 100),
      formattedAddress: location?.formattedAddress ?? null,
      placeId: location?.placeId ?? null,
    };

    onUpdateLocation(updated);
    setIsEditing(false);
  };

  const handleRemove = () => {
    onUpdateLocation(null);
    setCustomName('');
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="text-xs">
      {!location && !isEditing && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Attach your approximate location to this entry"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>{isLocating ? 'Detecting Location...' : 'Add Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline cursor-pointer"
          >
            Type place name
          </button>
        </div>
      )}

      {/* Manual Input Form */}
      {isEditing && (
        <form onSubmit={handleSaveCustomName} className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Quiet Café, City Park, Home Study..."
            className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 min-w-[200px]"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer"
            title="Save location name"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Attached Location Badge */}
      {location && !isEditing && (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium text-xs">
            {location.name || (location.latitude !== 0 ? `${location.latitude}, ${location.longitude}` : 'Location Set')}
          </span>
          {location.latitude !== 0 && (
            <span className="text-[10px] opacity-75 font-mono">
              ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setCustomName(location.name || '');
              setIsEditing(true);
            }}
            className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="p-0.5 rounded-sm hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 cursor-pointer ml-1"
            title="Remove location"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
