import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatKES } from "@/lib/property-helpers";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, property_images(url,is_cover)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("properties").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(`Listing ${v.status}`); qc.invalidateQueries({ queryKey: ["admin-pending"] }); },
  });

  if (!isAdmin) {
    return <div><h1 className="text-2xl font-semibold mb-2">Admin</h1><p className="text-muted-foreground text-sm">You don't have admin permissions. Ask an existing admin to grant you the role in the backend.</p></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Pending listings ({data.length})</h1>
      {data.length === 0 ? <p className="text-muted-foreground">Nothing pending — you're all caught up.</p> : (
        <div className="space-y-3">
          {data.map((p: any) => {
            const cover = p.property_images?.find((i: any) => i.is_cover)?.url ?? p.property_images?.[0]?.url;
            return (
              <Card key={p.id} className="p-4 flex gap-4 items-center">
                <div className="h-20 w-28 bg-muted rounded-lg overflow-hidden shrink-0">
                  {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><p className="font-semibold truncate">{p.title}</p><Badge variant="outline" className="capitalize">{p.property_type}</Badge></div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.city} · {formatKES(p.price)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => decide.mutate({ id: p.id, status: "approved" })}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button variant="outline" size="sm" onClick={() => decide.mutate({ id: p.id, status: "rejected" })}><X className="h-4 w-4 mr-1" /> Reject</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
