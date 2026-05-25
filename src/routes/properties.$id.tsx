import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Bed, Bath, Maximize2, MapPin, Phone, Mail, Heart, Calendar, Shield, Car, Sofa, Dog, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatKES } from "@/lib/property-helpers";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetailPage,
});

const inquirySchema = z.object({
  message: z.string().trim().min(10, "Tell the landlord a little more (min 10 chars)").max(2000),
  contact_phone: z.string().trim().max(40).optional(),
  preferred_viewing_date: z.string().optional(),
});

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeImg, setActiveImg] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*), profiles!properties_owner_id_fkey(id,full_name,phone,avatar_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: favorited } = useQuery({
    queryKey: ["favorite", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("property_id", id).eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
  });

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (favorited) {
        await supabase.from("favorites").delete().eq("property_id", id).eq("user_id", user.id);
      } else {
        await supabase.from("favorites").insert({ property_id: id, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite", id] }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ message: "", contact_phone: "", preferred_viewing_date: "" });
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!property) return <div className="container mx-auto px-4 py-20 text-center">Property not found.</div>;

  const images = (property.property_images ?? []).sort((a: any, b: any) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
  const cover = images[activeImg]?.url;

  const sendInquiry = async () => {
    if (!user) { navigate({ to: "/auth", search: { redirect: `/properties/${id}` } as any }); return; }
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      property_id: id,
      customer_id: user.id,
      landlord_id: property.owner_id,
      message: parsed.data.message,
      contact_phone: parsed.data.contact_phone || null,
      preferred_viewing_date: parsed.data.preferred_viewing_date || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Inquiry sent! The landlord will be in touch.");
    setOpen(false);
    setForm({ message: "", contact_phone: "", preferred_viewing_date: "" });
  };

  const amenityIcon: Record<string, any> = { Furnished: Sofa, Parking: Car, "Pet-friendly": Dog, Security: Shield };
  const amenitiesList = [
    property.furnished && "Furnished",
    property.parking && "Parking",
    property.pet_friendly && "Pet-friendly",
    property.security && "Security",
    ...(property.amenities ?? []),
  ].filter(Boolean) as string[];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Link to="/browse" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to browse
      </Link>

      {/* GALLERY */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-3 mb-8 rounded-2xl overflow-hidden">
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          {cover ? <img src={cover} alt={property.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-secondary to-muted" />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          {images.slice(1, 5).map((img: any, i: number) => (
            <button key={img.id} onClick={() => setActiveImg(i + 1)} className="aspect-square md:aspect-[16/8] bg-muted overflow-hidden rounded-lg">
              <img src={img.url} alt="" className="h-full w-full object-cover hover:opacity-90" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-primary capitalize">{property.listing_type === "rent" ? "For rent" : "For sale"}</Badge>
            <Badge variant="secondary" className="capitalize">{property.property_type}</Badge>
            {property.status === "pending" && <Badge variant="outline">Pending approval</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">{property.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mb-4">
            <MapPin className="h-4 w-4" /> {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
          </p>

          <div className="flex flex-wrap gap-6 py-4 border-y mb-6">
            <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary" /><span>{property.bedrooms} Bedrooms</span></div>
            <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-primary" /><span>{property.bathrooms} Bathrooms</span></div>
            {property.area_sqm && <div className="flex items-center gap-2"><Maximize2 className="h-5 w-5 text-primary" /><span>{property.area_sqm} m²</span></div>}
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">About this property</h2>
            <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">{property.description}</p>
          </section>

          {amenitiesList.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {amenitiesList.map((a) => {
                  const Icon = amenityIcon[a] ?? Shield;
                  return (
                    <div key={a} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                      <Icon className="h-4 w-4 text-primary" /> {a}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Location</h2>
            <p className="text-muted-foreground">{property.address}</p>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="md:sticky md:top-20 self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-3xl font-display font-semibold text-primary mb-1">
              {formatKES(property.price)}
              {property.listing_type === "rent" && <span className="text-sm font-sans text-muted-foreground font-normal">/month</span>}
            </p>
            <p className="text-xs text-muted-foreground mb-5">{property.views_count} views</p>

            <div className="flex items-center gap-3 py-4 border-y mb-4">
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-sm font-semibold">
                {(property.profiles?.full_name ?? "L")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{property.profiles?.full_name ?? "Landlord"}</p>
                <p className="text-xs text-muted-foreground">Verified landlord</p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-2" size="lg">
                  <Mail className="h-4 w-4 mr-2" /> Contact landlord
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Send an inquiry</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Message</Label>
                    <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Hi, I'm interested in this property. When can I view it?" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Phone (optional)</Label>
                      <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+254…" />
                    </div>
                    <div>
                      <Label>Preferred viewing date</Label>
                      <Input type="date" value={form.preferred_viewing_date} onChange={(e) => setForm({ ...form, preferred_viewing_date: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={sendInquiry} disabled={submitting} className="w-full">
                    {submitting ? "Sending…" : "Send inquiry"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full" onClick={() => user ? favMutation.mutate() : navigate({ to: "/auth" })}>
              <Heart className={`h-4 w-4 mr-2 ${favorited ? "fill-primary text-primary" : ""}`} />
              {favorited ? "Saved" : "Save to favorites"}
            </Button>

            {property.profiles?.phone && user && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" /> {property.profiles.phone}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
