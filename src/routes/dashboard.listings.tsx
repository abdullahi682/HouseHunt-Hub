import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye } from "lucide-react";
import { formatKES } from "@/lib/property-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/listings")({
  component: ListingsPage,
});

function ListingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, property_images(url,is_cover)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Listing deleted"); qc.invalidateQueries({ queryKey: ["my-listings"] }); },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My listings</h1>
        <Link to="/dashboard/listings/new"><Button><Plus className="h-4 w-4 mr-1" /> New listing</Button></Link>
      </div>
      {data.length === 0 ? <p className="text-muted-foreground">No listings yet.</p> : (
        <div className="space-y-3">
          {data.map((p: any) => {
            const cover = p.property_images?.find((i: any) => i.is_cover)?.url ?? p.property_images?.[0]?.url;
            return (
              <Card key={p.id} className="p-4 flex gap-4 items-center">
                <div className="h-20 w-28 bg-muted rounded-lg overflow-hidden shrink-0">
                  {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{p.title}</p>
                    <Badge variant={p.status === "approved" ? "default" : "outline"} className="capitalize">{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.city} · {formatKES(p.price)} · {p.views_count} views</p>
                </div>
                <div className="flex gap-1">
                  <Link to="/properties/$id" params={{ id: p.id }}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
                  <Button variant="ghost" size="icon" onClick={() => confirm("Delete this listing?") && del.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
