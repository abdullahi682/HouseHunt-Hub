import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Heart, Home, MessageSquare, Shield, Plus, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading, isLandlord, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } as any });
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  const items = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { to: "/dashboard/inquiries", label: "My inquiries", icon: MessageSquare },
    ...(isLandlord ? [
      { to: "/dashboard/listings", label: "My listings", icon: Home },
      { to: "/dashboard/listings/new", label: "Add listing", icon: Plus },
    ] : []),
    ...(isAdmin ? [{ to: "/dashboard/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to as any}
            activeOptions={{ exact: it.exact }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50"
          >
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        ))}
      </aside>
      <Outlet />
    </div>
  );
}
