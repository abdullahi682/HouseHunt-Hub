import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard } from "@/components/property-card";

export const Route = createFileRoute("/dashboard/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["my-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("property:properties(id,title,price,city,neighborhood,bedrooms,bathrooms,area_sqm,listing_type,property_type, property_images(url,is_cover))")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => ({
        ...r.property,
        cover_url: r.property?.property_images?.find((i: any) => i.is_cover)?.url ?? r.property?.property_images?.[0]?.url ?? null,
      })).filter((p: any) => p?.id);
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Saved properties</h1>
      {data.length === 0 ? (
        <p className="text-muted-foreground">You haven't saved any properties yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {data.map((p: any) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
