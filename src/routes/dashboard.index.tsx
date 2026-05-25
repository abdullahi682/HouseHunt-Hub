import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Heart, MessageSquare, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user, isLandlord, refreshRoles } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [fav, inq, mine] = await Promise.all([
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("customer_id", user!.id),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user!.id),
      ]);
      return { favorites: fav.count ?? 0, inquiries: inq.count ?? 0, listings: mine.count ?? 0 };
    },
  });

  const becomeLandlord = async () => {
    const { error } = await supabase.from("user_roles").insert({ user_id: user!.id, role: "landlord" });
    if (error) toast.error(error.message); else { toast.success("You're now a landlord — start listing!"); await refreshRoles(); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
      <p className="text-muted-foreground text-sm mb-8">{user?.email}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5"><Heart className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-semibold">{stats?.favorites ?? 0}</p><p className="text-sm text-muted-foreground">Saved properties</p></Card>
        <Card className="p-5"><MessageSquare className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-semibold">{stats?.inquiries ?? 0}</p><p className="text-sm text-muted-foreground">Inquiries sent</p></Card>
        <Card className="p-5"><Home className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-semibold">{stats?.listings ?? 0}</p><p className="text-sm text-muted-foreground">My listings</p></Card>
      </div>

      {!isLandlord ? (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="font-semibold mb-1">Are you a landlord?</h2>
          <p className="text-sm text-muted-foreground mb-4">Become a verified landlord and start listing properties for free.</p>
          <Button onClick={becomeLandlord}><Shield className="h-4 w-4 mr-2" /> Become a landlord</Button>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="font-semibold mb-3">Quick actions</h2>
          <div className="flex gap-2">
            <Link to="/dashboard/listings/new"><Button><Plus className="h-4 w-4 mr-1" /> New listing</Button></Link>
            <Link to="/dashboard/listings"><Button variant="outline">Manage listings</Button></Link>
          </div>
        </Card>
      )}
    </div>
  );
}
