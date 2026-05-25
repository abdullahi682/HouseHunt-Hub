import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/property-helpers";

export const Route = createFileRoute("/dashboard/inquiries")({
  component: InquiriesPage,
});

function InquiriesPage() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["my-inquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("*, property:properties(id,title,price,city,listing_type)")
        .or(`customer_id.eq.${user!.id},landlord_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Inquiries</h1>
      {data.length === 0 ? <p className="text-muted-foreground">No inquiries yet.</p> : (
        <div className="space-y-3">
          {data.map((i: any) => (
            <Card key={i.id} className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{i.property?.title ?? "Property"}</p>
                  <p className="text-xs text-muted-foreground">{i.property && formatKES(i.property.price)} · {new Date(i.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className="capitalize">{i.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm">{i.message}</p>
              {i.preferred_viewing_date && <p className="text-xs text-muted-foreground mt-2">Viewing: {i.preferred_viewing_date}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
