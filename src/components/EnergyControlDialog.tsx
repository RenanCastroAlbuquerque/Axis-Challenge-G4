import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRL, chargeMinutes, fmt } from "@/lib/axis";
import { energyDecision, evaluateEnergy, MIN_FULL_POWER_W, type EnergyCheck } from "@/lib/energy";
import { cn } from "@/lib/utils";

const decisionIcon = { authorized: CheckCircle2, reduced: AlertTriangle, blocked: Ban };

const parseWatts = (v: string) => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const watts = (v: number) => `${fmt(v, 0)} W`;

/**
 * "Iniciar recarga" step: asks for local generation and consumption, runs the
 * Controlador Energético and only lets the charge start when there is surplus.
 */
export function EnergyControlDialog({
  open,
  onOpenChange,
  chargerName,
  chargerKw,
  targetKwh,
  pricePerKwh,
  pricePerMinute,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargerName: string;
  chargerKw: number;
  targetKwh: number;
  pricePerKwh: number;
  pricePerMinute: number;
  pending: boolean;
  onConfirm: (check: EnergyCheck) => void;
}) {
  const [generation, setGeneration] = useState("4000");
  const [consumption, setConsumption] = useState("1500");

  const generationW = parseWatts(generation);
  const consumptionW = parseWatts(consumption);
  const valid = generationW !== null && consumptionW !== null;
  const check = valid ? evaluateEnergy(generationW, consumptionW, chargerKw) : null;
  const meta = check ? energyDecision[check.decision] : null;
  const Icon = check ? decisionIcon[check.decision] : null;

  const minutes = check ? chargeMinutes(targetKwh, check.chargePowerKw) : 0;
  const cost = targetKwh * pricePerKwh + minutes * pricePerMinute;

  const confirm = () => {
    // Re-run the rule at confirmation time so a blocked charge never starts.
    if (!valid) return;
    const result = evaluateEnergy(generationW, consumptionW, chargerKw);
    if (result.decision === "blocked") return;
    onConfirm(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Iniciar recarga</DialogTitle>
          <DialogDescription>
            Controle energético de {chargerName}: a recarga usa o excedente da geração local.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="energy-generation" className="text-[0.8125rem] font-medium">
                Geração de energia (W)
              </Label>
              <Input
                id="energy-generation"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                aria-invalid={generationW === null}
                className="figures"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="energy-consumption" className="text-[0.8125rem] font-medium">
                Consumo atual (W)
              </Label>
              <Input
                id="energy-consumption"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                aria-invalid={consumptionW === null}
                className="figures"
              />
            </div>
          </div>

          {check && meta && Icon ? (
            <div
              className={cn("rounded-md border px-3.5 py-3", meta.tone)}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2.5">
                <Icon className={cn("mt-0.5 size-5 shrink-0", meta.text)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={cn("font-semibold", meta.text)}>{meta.label}</p>
                    <p className={cn("text-sm font-semibold figures", meta.text)}>
                      {watts(check.availableW)} disponíveis
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{meta.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
              Informe valores numéricos iguais ou maiores que zero.
            </p>
          )}

          <dl className="divide-y divide-border rounded-md border border-border text-sm figures">
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-muted-foreground">Potência disponível</dt>
              <dd className="font-medium">{check ? watts(check.availableW) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-muted-foreground">Potência de recarga</dt>
              <dd className="font-medium">
                {check && check.chargePowerKw > 0 ? `${fmt(check.chargePowerKw, 1)} kW` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-muted-foreground">Tempo estimado</dt>
              <dd className="font-medium">
                {minutes > 0
                  ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-muted-foreground">Custo estimado</dt>
              <dd className="text-base font-semibold">{minutes > 0 ? BRL(cost) : "—"}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Potência disponível = geração − consumo. Abaixo de {watts(MIN_FULL_POWER_W)} a recarga é
            reduzida; sem excedente, é bloqueada.
          </p>
        </div>

        <DialogFooter className="sticky bottom-0 gap-2 border-t border-border bg-card px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={pending || !check || check.decision === "blocked"}>
            {pending ? <Loader2 className="animate-spin" /> : <Zap />}
            {check?.decision === "blocked"
              ? "Recarga bloqueada"
              : check?.decision === "reduced"
                ? "Iniciar com potência reduzida"
                : "Confirmar recarga"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
