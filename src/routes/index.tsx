import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, Shield, Home, TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard } from "@/components/property-card";
import { KENYA_CITIES } from "@/lib/property-helpers";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "HouseHunt Kenya — Rent or buy your next home" },
      { name: "description", content: "Discover verified houses, apartments and rentals across Nairobi, Mombasa, Kisumu and beyond. Contact landlords directly." },
    ],
  }),
});

function HomePage() {
  const navigate = useNavigate();
  const [city, setCity] = useState<string>("any");
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [q, setQ] = useState("");

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,price,city,neighborhood,bedrooms,bathrooms,area_sqm,listing_type,property_type, property_images(url,is_cover,sort_order)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        cover_url: p.property_images?.find((i: any) => i.is_cover)?.url ?? p.property_images?.[0]?.url ?? null,
      }));
    },
  });

  const handleSearch = () => {
    navigate({
      to: "/browse",
      search: {
        listing_type: listingType,
        ...(city !== "any" ? { city } : {}),
        ...(q ? { q } : {}),
      } as any,
    });
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={hero} alt="" width={1920} height={1080} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-background" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-cream/95 px-3 py-1 text-xs font-medium text-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Verified listings across Kenya
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-cream leading-[1.05] mb-6">
              Find a place that<br />feels like <span className="italic text-accent">home</span>.
            </h1>
            <p className="text-base md:text-lg text-cream/90 max-w-xl mb-8">
              Browse thousands of trusted houses and apartments to rent or buy across Nairobi, Mombasa, Kisumu, and beyond — direct from verified landlords.
            </p>
          </div>

          {/* Search card */}
          <div className="bg-card rounded-2xl p-2 shadow-2xl max-w-4xl">
            <div className="flex border-b">
              {(["rent", "sale"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setListingType(t)}
                  className={`px-5 py-2 text-sm font-medium rounded-t-lg transition ${listingType === t ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground"}`}
                >
                  {t === "rent" ? "Rent" : "Buy"}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by neighborhood, title or keyword…"
                  className="pl-9 h-12 border-0 focus-visible:ring-0"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12 min-w-[180px] border-0 focus:ring-0">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Any city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any city</SelectItem>
                  {KENYA_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="lg" onClick={handleSearch} className="h-12 px-8">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y bg-secondary/40">
        <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Shield, label: "Verified", value: "Landlord ID checks" },
            { icon: Home, label: "All over Kenya", value: "13+ cities & growing" },
            { icon: TrendingUp, label: "No agents fees", value: "Direct to landlord" },
            { icon: MapPin, label: "Hyper-local", value: "Browse by estate" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="h-6 w-6 text-primary mb-1" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm text-primary font-medium mb-1">Featured</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Newly listed homes</h2>
          </div>
          <Link to="/browse" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed py-16 text-center">
            <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No listings yet</p>
            <p className="text-sm text-muted-foreground mb-4">Be the first landlord to list a property.</p>
            <Button onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as any })}>Become a landlord</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p: any) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-3">List your property — reach renters today</h2>
            <p className="text-primary-foreground/85 mb-6">Free to list. Get verified landlord status, manage inquiries, and connect directly with serious house-seekers.</p>
            <Button size="lg" variant="secondary" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as any })}>
              Get started — it's free
            </Button>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["Free listings forever", "Direct messages from tenants", "Manage viewing requests", "Track listing views"].map((f) => (
                <div key={f} className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur">✓ {f}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
