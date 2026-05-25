import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PROPERTY_TYPES, KENYA_CITIES } from "@/lib/property-helpers";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/listings/new")({
  component: NewListingPage,
});

const schema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(5000),
  property_type: z.enum(["apartment", "house", "studio", "bedsitter", "townhouse", "villa", "commercial", "land"]),
  listing_type: z.enum(["rent", "sale"]),
  price: z.coerce.number().positive().max(1_000_000_000),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  area_sqm: z.coerce.number().positive().max(100000).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(100).optional(),
});

function NewListingPage() {
  const { user, isLandlord, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    title: "", description: "", property_type: "apartment", listing_type: "rent",
    price: "", bedrooms: "1", bathrooms: "1", area_sqm: "",
    address: "", city: "Nairobi", neighborhood: "",
    furnished: false, parking: false, pet_friendly: false, security: false,
  });

  const submit = async () => {
    if (!user) return;
    if (!isLandlord) {
      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "landlord" });
      if (error) { toast.error("Could not assign landlord role"); return; }
      await refreshRoles();
    }
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { data: prop, error } = await supabase.from("properties").insert({
        owner_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        property_type: parsed.data.property_type,
        listing_type: parsed.data.listing_type,
        price: parsed.data.price,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        area_sqm: parsed.data.area_sqm || null,
        address: parsed.data.address,
        city: parsed.data.city,
        neighborhood: parsed.data.neighborhood || null,
        furnished: f.furnished, parking: f.parking, pet_friendly: f.pet_friendly, security: f.security,
        status: "pending",
      }).select().single();
      if (error) throw error;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${user.id}/${prop.id}/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("property-images").upload(path, file);
        if (upErr) { toast.error(`Image upload failed: ${upErr.message}`); continue; }
        const { data: pub } = supabase.storage.from("property-images").getPublicUrl(path);
        await supabase.from("property_images").insert({
          property_id: prop.id, url: pub.publicUrl, is_cover: i === 0, sort_order: i,
        });
      }
      toast.success("Listing submitted! It will appear after admin approval.");
      navigate({ to: "/dashboard/listings" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create listing");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">List a new property</h1>
      <Card className="p-6 space-y-5">
        <div>
          <Label>Title</Label>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Spacious 2BR apartment in Kilimani" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Describe the property…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Listing type</Label>
            <Select value={f.listing_type} onValueChange={(v) => setF({ ...f, listing_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="rent">For rent</SelectItem><SelectItem value="sale">For sale</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Property type</Label>
            <Select value={f.property_type} onValueChange={(v) => setF({ ...f, property_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Price (KES)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><Label>Bedrooms</Label><Input type="number" value={f.bedrooms} onChange={(e) => setF({ ...f, bedrooms: e.target.value })} /></div>
          <div><Label>Bathrooms</Label><Input type="number" value={f.bathrooms} onChange={(e) => setF({ ...f, bathrooms: e.target.value })} /></div>
          <div><Label>Area (m²)</Label><Input type="number" value={f.area_sqm} onChange={(e) => setF({ ...f, area_sqm: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>City</Label>
            <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KENYA_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Neighborhood</Label><Input value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} placeholder="Kilimani" /></div>
          <div><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Wood Ave" /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {([["furnished", "Furnished"], ["parking", "Parking"], ["pet_friendly", "Pet-friendly"], ["security", "Security"]] as const).map(([k, lbl]) => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={(f as any)[k]} onCheckedChange={(c) => setF({ ...f, [k]: !!c })} />
              {lbl}
            </label>
          ))}
        </div>

        <div>
          <Label>Photos (first photo becomes cover)</Label>
          <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-secondary/30">
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">Click to add photos (up to 10)</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 10))} />
          </label>
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="" />
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-foreground/80 text-background">
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Cover</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={submit} disabled={busy} className="flex-1">{busy ? "Submitting…" : "Submit for approval"}</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/dashboard/listings" })}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
