import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ address: z.string().trim().min(3).max(500) }).parse(data)
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    const res = await fetch(
      `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        },
      }
    );
    const json: any = await res.json();
    if (!res.ok || json.status !== "OK" || !json.results?.[0]) {
      return { lat: null as number | null, lng: null as number | null, formatted: null as string | null };
    }
    const loc = json.results[0].geometry.location;
    return { lat: loc.lat as number, lng: loc.lng as number, formatted: json.results[0].formatted_address as string };
  });
