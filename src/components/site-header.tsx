import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Heart, LayoutDashboard, LogOut, Plus, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, isLandlord, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">HouseHunt</span>
          <span className="hidden sm:inline text-xs text-muted-foreground font-medium ml-1">KE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/browse" className="text-foreground/80 hover:text-primary transition">Browse</Link>
          <Link to="/browse" search={{ listing_type: "rent" }} className="text-foreground/80 hover:text-primary transition">Rent</Link>
          <Link to="/browse" search={{ listing_type: "sale" }} className="text-foreground/80 hover:text-primary transition">Buy</Link>
          {isLandlord && <Link to="/dashboard/listings" className="text-foreground/80 hover:text-primary transition">My Listings</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isLandlord && (
                <Button size="sm" onClick={() => navigate({ to: "/dashboard/listings/new" })} className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-1" /> List property
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/favorites" })}>
                    <Heart className="h-4 w-4 mr-2" /> Favorites
                  </DropdownMenuItem>
                  {isLandlord && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/listings" })}>
                      <Home className="h-4 w-4 mr-2" /> My Listings
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/admin" })}>
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
              <Button size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
