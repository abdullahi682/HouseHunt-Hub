import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard } from "@/components/property-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { KENYA_CITIES, PROPERTY_TYPES } from "@/lib/property-helpers";

const searchSchema = z.object({
  listing_type: z.enum(["rent", "sale"]).optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  type: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  furnished: z.coerce.boolean().optional(),
  parking: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  component: BrowsePage,
  head: () => ({
    meta: [
      { title: "Browse properties — HouseHunt Kenya" },
      { name: "description", content: "Search verified rental and for-sale houses, apartments, and bedsitters across Kenya." },
    ],
  }),
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [localQ, setLocalQ] = useState(search.q ?? "");

  const update = (patch: any) => navigate({ to: "/browse", search: { ...search, ...patch } });

  const { data = [], isLoading } = useQuery({
    queryKey: ["browse", search],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id,title,price,city,neighborhood,bedrooms,bathrooms,area_sqm,listing_type,property_type, property_images(url,is_cover,sort_order)")
        .eq("status", "approved");

      if (search.listing_type) q = q.eq("listing_type", search.listing_type);
      if (search.city) q = q.eq("city", search.city);
      if (search.type) q = q.eq("property_type", search.type as any);
      if (search.bedrooms) q = q.gte("bedrooms", search.bedrooms);
      if (search.min_price) q = q.gte("price", search.min_price);
      if (search.max_price) q = q.lte("price", search.max_price);
      if (search.furnished) q = q.eq("furnished", true);
      if (search.parking) q = q.eq("parking", true);
      if (search.q) q = q.or(`title.ilike.%${search.q}%,description.ilike.%${search.q}%,neighborhood.ilike.%${search.q}%`);

      const { data, error } = await q.order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        cover_url: p.property_images?.find((i: any) => i.is_cover)?.url ?? p.property_images?.[0]?.url ?? null,
      }));
    },
  });

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.type) n++;
    if (search.bedrooms) n++;
    if (search.min_price || search.max_price) n++;
    if (search.furnished) n++;
    if (search.parking) n++;
    return n;
  }, [search]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && update({ q: localQ || undefined })}
            placeholder="Search title, description or estate…"
            className="pl-9 h-11"
          />
        </div>
        <Select value={search.city ?? "any"} onValueChange={(v) => update({ city: v === "any" ? undefined : v })}>
          <SelectTrigger className="h-11 md:w-44"><MapPin className="h-4 w-4 mr-1" /><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any city</SelectItem>
            {KENYA_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.listing_type ?? "any"} onValueChange={(v) => update({ listing_type: v === "any" ? undefined : v })}>
          <SelectTrigger className="h-11 md:w-36"><SelectValue placeholder="Rent or buy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Rent or Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
            <SelectItem value="sale">Buy</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              {activeFilterCount > 0 && <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs h-5 w-5 grid place-items-center">{activeFilterCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="space-y-6 mt-6">
              <div>
                <Label>Property type</Label>
                <Select value={search.type ?? "any"} onValueChange={(v) => update({ type: v === "any" ? undefined : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bedrooms (min)</Label>
                <Select value={String(search.bedrooms ?? "any")} onValueChange={(v) => update({ bedrooms: v === "any" ? undefined : Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex justify-between">Price range
                  <span className="text-xs text-muted-foreground">
                    {search.min_price ? `KES ${search.min_price.toLocaleString()}` : "0"} – {search.max_price ? `KES ${search.max_price.toLocaleString()}` : "any"}
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input type="number" placeholder="Min" value={search.min_price ?? ""} onChange={(e) => update({ min_price: e.target.value ? Number(e.target.value) : undefined })} />
                  <Input type="number" placeholder="Max" value={search.max_price ?? ""} onChange={(e) => update({ max_price: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="furn" checked={!!search.furnished} onCheckedChange={(c) => update({ furnished: c ? true : undefined })} />
                <Label htmlFor="furn">Furnished</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="park" checked={!!search.parking} onCheckedChange={(c) => update({ parking: c ? true : undefined })} />
                <Label htmlFor="park">Parking</Label>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/browse", search: {} as any })}>
                <X className="h-4 w-4 mr-1" /> Clear all
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{isLoading ? "Loading…" : `${data.length} ${data.length === 1 ? "property" : "properties"} found`}</p>

      {data.length === 0 && !isLoading ? (
        <div className="rounded-2xl border-2 border-dashed py-20 text-center">
          <p className="font-medium mb-1">No properties match your filters</p>
          <p className="text-sm text-muted-foreground mb-4">Try removing a filter or searching another city.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/browse", search: {} as any })}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((p: any) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}

// Unused but imported above for completeness
void Slider;
