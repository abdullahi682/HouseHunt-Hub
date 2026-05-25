import { Link } from "@tanstack/react-router";
import { Bed, Bath, MapPin, Maximize2, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/property-helpers";
import { cn } from "@/lib/utils";

export interface PropertyCardData {
  id: string;
  title: string;
  price: number | string;
  city: string;
  neighborhood: string | null;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | string | null;
  listing_type: "rent" | "sale";
  property_type: string;
  cover_url?: string | null;
}

export function PropertyCard({
  property,
  favorited,
  onToggleFavorite,
}: {
  property: PropertyCardData;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  const p = property;
  return (
    <Link
      to="/properties/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl bg-card border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {p.cover_url ? (
          <img
            src={p.cover_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-secondary to-muted grid place-items-center text-muted-foreground">
            <span className="font-display text-2xl opacity-40">HouseHunt</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground capitalize">{p.listing_type === "rent" ? "For rent" : "For sale"}</Badge>
          <Badge variant="secondary" className="capitalize bg-card/90 backdrop-blur">{p.property_type}</Badge>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur hover:bg-card transition"
            aria-label="Toggle favorite"
          >
            <Heart className={cn("h-4 w-4", favorited ? "fill-primary text-primary" : "text-foreground")} />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <p className="font-display text-xl font-semibold text-primary">
            {formatKES(p.price)}
            {p.listing_type === "rent" && <span className="text-xs font-sans text-muted-foreground font-normal">/mo</span>}
          </p>
        </div>
        <h3 className="font-semibold line-clamp-1 mb-1">{p.title}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-3 w-3" />
          {p.neighborhood ? `${p.neighborhood}, ` : ""}{p.city}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.bedrooms} bd</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms} ba</span>
          {p.area_sqm && <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area_sqm} m²</span>}
        </div>
      </div>
    </Link>
  );
}
