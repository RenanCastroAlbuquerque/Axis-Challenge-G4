/**
 * Controlador Energético: decides whether a charge can start from the local
 * solar generation and the site's current consumption.
 *
 *   disponível = geração − consumo
 *
 *   disponível ≤ 0                 → bloqueada (consumo supera a geração)
 *   0 < disponível < limite        → reduzida  (carrega só com o excedente)
 *   disponível ≥ limite            → autorizada
 */
export type EnergyDecision = "authorized" | "reduced" | "blocked";

/**
 * Below this surplus the charger can't run at its nominal rate.
 * 1.4 kW ≈ 6 A × 230 V, the lowest current an EV accepts (IEC 61851).
 */
export const MIN_FULL_POWER_W = 1400;

export type EnergyCheck = {
  availableW: number;
  decision: EnergyDecision;
  /** Power actually delivered to the car, capped by the charger's rating. */
  chargePowerKw: number;
};

export function evaluateEnergy(
  generationW: number,
  consumptionW: number,
  chargerKw: number,
): EnergyCheck {
  const availableW = generationW - consumptionW;
  const decision: EnergyDecision =
    availableW <= 0 ? "blocked" : availableW < MIN_FULL_POWER_W ? "reduced" : "authorized";
  const chargePowerKw = decision === "blocked" ? 0 : Math.min(chargerKw, availableW / 1000);
  return { availableW, decision, chargePowerKw };
}

type DecisionMeta = {
  label: string;
  description: string;
  /** Tinted surface for the status callout */
  tone: string;
  /** Solid color for icon and number */
  text: string;
};

export const energyDecision: Record<EnergyDecision, DecisionMeta> = {
  authorized: {
    label: "Recarga autorizada",
    description: "Há excedente de energia suficiente para carregar na potência normal.",
    tone: "bg-success/10 border-success/25",
    text: "text-success",
  },
  reduced: {
    label: "Recarga reduzida",
    description:
      "O excedente é baixo: a recarga vai usar só a energia disponível e levar mais tempo.",
    tone: "bg-warning/12 border-warning/30",
    text: "text-warning",
  },
  blocked: {
    label: "Recarga bloqueada",
    description: "O consumo atual supera a geração. Reduza o consumo ou aguarde mais geração.",
    tone: "bg-destructive/10 border-destructive/25",
    text: "text-destructive",
  },
};
