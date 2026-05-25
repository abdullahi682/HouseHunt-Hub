import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  full_name: z.string().trim().min(2, "Enter your name").max(100),
});
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["signup", "login"]).optional(),
    redirect: z.string().optional(),
  }),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — HouseHunt Kenya" }] }),
});

function AuthPage() {
  const { mode: initialMode, redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signup" | "login">(initialMode ?? "login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const next = () => navigate({ to: (redirect as any) ?? "/dashboard" });

  const handleEmail = async () => {
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { data: { full_name: parsed.data.full_name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        setMode("login");
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) throw error;
        toast.success("Welcome back!");
        next();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error("Google sign-in failed"); setBusy(false); return; }
    if (result.redirected) return;
    next();
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 grid place-items-center rounded-xl bg-primary text-primary-foreground mb-3">
            <Home className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "signup" ? "Find your next home in minutes." : "Sign in to continue your search."}</p>
        </div>

        <Button variant="outline" className="w-full mb-4" onClick={handleGoogle} disabled={busy}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or with email</span></div>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <Button onClick={handleEmail} disabled={busy} className="w-full">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signup" ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-primary font-medium hover:underline">
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </Card>
    </div>
  );
}
