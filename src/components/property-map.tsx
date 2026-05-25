import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { geocodeAddress } from "@/lib/geocode.functions";

declare global {
  interface Window {
    google?: any;
    __initGoogleMaps?: () => void;
    __googleMapsLoading?: Promise<void>;
  }
}

function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__googleMapsLoading) return window.__googleMapsLoading;

  window.__googleMapsLoading = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID ?? "";
    if (!key) { reject(new Error("Maps browser key missing")); return; }
    window.__initGoogleMaps = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initGoogleMaps${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__googleMapsLoading;
}

export function PropertyMap({
  lat,
  lng,
  address,
  title,
  className = "h-72 w-full rounded-xl overflow-hidden border",
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  title?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null
  );
  const [err, setErr] = useState<string | null>(null);
  const geocode = useServerFn(geocodeAddress);

  // Resolve coords from address if not provided
  useEffect(() => {
    if (coords || !address) return;
    let cancelled = false;
    geocode({ data: { address } })
      .then((r) => { if (!cancelled && r.lat != null && r.lng != null) setCoords({ lat: r.lat, lng: r.lng }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [address, coords, geocode]);

  // Init map
  useEffect(() => {
    if (!coords || !ref.current) return;
    let map: any;
    loadMapsScript()
      .then(() => {
        if (!ref.current) return;
        map = new window.google.maps.Map(ref.current, {
          center: coords,
          zoom: 15,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
        });
        new window.google.maps.Marker({ position: coords, map, title: title ?? "" });
      })
      .catch((e) => setErr(e.message));
  }, [coords, title]);

  if (err) return <div className={`${className} grid place-items-center text-sm text-muted-foreground bg-muted`}>Map unavailable</div>;
  if (!coords) return <div className={`${className} grid place-items-center text-sm text-muted-foreground bg-muted`}>Locating address…</div>;
  return <div ref={ref} className={className} />;
}
