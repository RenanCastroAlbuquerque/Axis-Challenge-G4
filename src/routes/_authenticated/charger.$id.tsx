import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, MapPin, Star, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapCanvas } from "@/components/MapCanvas";
import { ChargerImage } from "@/components/ChargerImage";
import { EnergyControlDialog } from "@/components/EnergyControlDialog";
import { Metric, MetricStrip } from "@/components/Metric";
import { Panel, PanelHeader } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { chargerCover } from "@/constants/chargerImages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  BRL,
  chargeMinutes,
  distanceKm,
  driveMinutes,
  fmt,
  formatKm,
  num,
  SAO_PAULO,
} from "@/lib/axis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/charger/$id")({
  head: () => ({
    meta: [
      { title: "Carregador — AXIS" },
      { name: "description", content: "Fotos, preço, distância, rota e estimativa de recarga do carregador." },
      { property: "og:title", content: "Carregador — AXIS" },
      { property: "og:description", content: "Fotos, preço, distância, rota e estimativa de recarga." },
    ],
  }),
  component: ChargerDetail,
});

function ChargerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [target, setTarget] = useState(30);
  const [photo, setPhoto] = useState(0);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [energyOpen, setEnergyOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos(SAO_PAULO),
    );
  }, []);

  const { data: charger } = useQuery({
    queryKey: ["charger", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chargers").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: queue = [] } = useQuery({
    queryKey: ["queue", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("charger_queue").select("*").eq("charger_id", id);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charger_reviews")
        .select("*")
        .eq("charger_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const startSession = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("charging_sessions")
        .insert({ charger_id: id, user_id: auth.user.id, target_kwh: target, battery_percent: 20 })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("chargers").update({ status: "occupied" }).eq("id", id);
      return data.id as string;
    },
    onSuccess: (sessionId) => {
      setEnergyOpen(false);
      qc.invalidateQueries({ queryKey: ["charger", id] });
      navigate({ to: "/session/$id", params: { id: sessionId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao iniciar recarga"),
  });

  const joinQueue = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("charger_queue").insert({ charger_id: id, user_id: auth.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Você entrou na fila deste carregador");
      qc.invalidateQueries({ queryKey: ["queue", id] });
    },
    onError: () => toast.error("Você já está na fila"),
  });

  const sendReview = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("charger_reviews")
        .upsert(
          { charger_id: id, user_id: auth.user.id, rating, comment },
          { onConflict: "charger_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Avaliação enviada");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });

  if (!charger) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-lg sm:h-72" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const origin = pos ?? SAO_PAULO;
  const km = distanceKm(origin.lat, origin.lng, charger.latitude, charger.longitude);
  const eta = driveMinutes(km);
  const minutes = chargeMinutes(target, num(charger.power_kw));
  const cost = target * num(charger.price_per_kwh) + minutes * num(charger.price_per_minute);
  const photos: string[] = charger.photos ?? [];
  const avg = reviews.length
    ? reviews.reduce((s: number, r) => s + num(r.rating), 0) / reviews.length
    : null;

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2.5">
        <Link to="/map">
          <ArrowLeft /> Mapa
        </Link>
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-muted shadow-xs">
            <ChargerImage
              src={photos[photo] ?? chargerCover(photos, charger.id)}
              seed={charger.id}
              alt={charger.name}
              className="h-56 w-full object-cover sm:h-80"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPhoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === photo}
                  className={cn(
                    "size-14 shrink-0 overflow-hidden rounded-md border-2 transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    i === photo ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <ChargerImage src={p} seed={charger.id} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="mr-1 text-[1.5rem] leading-tight sm:text-[1.75rem]">{charger.name}</h1>
              <StatusBadge status={charger.status} />
              <Badge variant="secondary">{charger.model}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {charger.address}
              </span>
              {avg !== null && (
                <span className="inline-flex items-center gap-1 figures">
                  <Star className="size-4 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{fmt(avg, 1)}</span>
                  <span>
                    ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
                  </span>
                </span>
              )}
            </div>
            {charger.description && (
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {charger.description}
              </p>
            )}
            {charger.amenities?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {charger.amenities.map((a: string) => (
                  <Badge key={a} variant="outline">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <MetricStrip className="sm:grid-cols-4">
            <Metric label="Preço" value={BRL(num(charger.price_per_kwh))} unit="/kWh" />
            <Metric label="Potência" value={num(charger.power_kw)} unit="kW" />
            <Metric label="Distância" value={formatKm(km)} />
            <Metric label="Chegada" value={eta} unit="min" />
          </MetricStrip>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Como chegar"
              description={charger.connector_type ? `Conector ${charger.connector_type}` : undefined}
              actions={
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${charger.latitude},${charger.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir no Google Maps <ExternalLink />
                  </a>
                </Button>
              }
            />
            <div className="h-64">
              <MapCanvas
                chargers={[charger as never]}
                center={{ lat: charger.latitude, lng: charger.longitude }}
                userPosition={pos}
                routeTo={{ lat: charger.latitude, lng: charger.longitude }}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[calc(var(--app-header-h)+1.5rem)] lg:self-start">
          <Panel>
            <PanelHeader title="Simular recarga" description="Escolha quanta energia quer carregar" />
            <div className="p-4">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="energy-target" className="text-sm text-muted-foreground">
                  Energia
                </Label>
                <span className="display-wide text-[1.75rem] font-semibold leading-none figures">
                  {target}
                  <span className="ml-1 text-sm font-medium text-muted-foreground [font-stretch:100%]">
                    kWh
                  </span>
                </span>
              </div>
              <Slider
                id="energy-target"
                className="mt-4"
                value={[target]}
                min={5}
                max={80}
                step={5}
                onValueChange={(v) => setTarget(v[0] ?? 30)}
                aria-label="Energia desejada em kWh"
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground figures">
                <span>5 kWh</span>
                <span>80 kWh</span>
              </div>
              <dl className="mt-4 divide-y divide-border rounded-md border border-border text-sm figures">
                <div className="flex items-center justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Tempo estimado</dt>
                  <dd className="font-medium">
                    {Math.floor(minutes / 60)}h {String(minutes % 60).padStart(2, "0")}min
                  </dd>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Custo estimado</dt>
                  <dd className="text-base font-semibold">{BRL(cost)}</dd>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Fila agora</dt>
                  <dd className="inline-flex items-center gap-1.5 font-medium">
                    <Users className="size-4 text-muted-foreground" /> {queue.length}
                  </dd>
                </div>
              </dl>
              {charger.status === "available" ? (
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={() => setEnergyOpen(true)}
                  disabled={startSession.isPending}
                >
                  <Zap /> {startSession.isPending ? "Iniciando..." : "Iniciar recarga"}
                </Button>
              ) : (
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => joinQueue.mutate()}
                  disabled={joinQueue.isPending}
                >
                  <Users /> Entrar na fila
                </Button>
              )}
            </div>
          </Panel>

          <EnergyControlDialog
            open={energyOpen}
            onOpenChange={setEnergyOpen}
            chargerName={charger.name}
            chargerKw={num(charger.power_kw)}
            targetKwh={target}
            pricePerKwh={num(charger.price_per_kwh)}
            pricePerMinute={num(charger.price_per_minute)}
            pending={startSession.isPending}
            onConfirm={(check) => {
              if (check.decision === "reduced") {
                toast.warning("Iniciando recarga com potência reduzida");
              }
              startSession.mutate();
            }}
          />

          <Panel>
            <PanelHeader title="Avaliações" description={reviews.length ? undefined : "Seja o primeiro a avaliar"} />
            <div className="space-y-3 p-4">
              <div className="flex gap-0.5" role="radiogroup" aria-label="Sua nota">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={n === rating}
                    onClick={() => setRating(n)}
                    aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                    className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:scale-100"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        n <= rating ? "fill-warning text-warning" : "text-muted-foreground/60",
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Como foi sua experiência?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Comentário"
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={() => sendReview.mutate()}
                disabled={sendReview.isPending}
              >
                Enviar avaliação
              </Button>
            </div>
            {reviews.length > 0 && (
              <ul className="divide-y divide-border border-t border-border">
                {reviews.map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <div className="flex gap-0.5" aria-label={`${num(r.rating)} de 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < num(r.rating) ? "fill-warning text-warning" : "text-muted-foreground/40",
                          )}
                        />
                      ))}
                    </div>
                    {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
