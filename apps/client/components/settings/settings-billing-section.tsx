"use client";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";

const PLANS = [
  { plan: "creator" as const, label: "Creator", price: "$15/mo" },
  { plan: "pro" as const, label: "Pro", price: "$29/mo" },
  { plan: "studio" as const, label: "Studio", price: "$59/mo" },
] as const;

type SettingsBillingSectionProps = {
  plan: string | undefined;
  status: string | undefined;
  checkoutIsPending: boolean;
  onStartCheckout: (plan: "creator" | "pro" | "studio") => void;
};

export function SettingsBillingSection({
  plan,
  status,
  checkoutIsPending,
  onStartCheckout,
}: SettingsBillingSectionProps) {
  return (
    <AnalogCard className="space-y-4 p-6">
      <PanelTitle label="Subscription" title="Billing" />
      <AnalogInset className="space-y-1 p-4">
        <MonoLabel>Current plan</MonoLabel>
        <p className="font-mono text-sm font-bold tracking-wide uppercase">
          {plan ?? "TRIAL"} · {status ?? "TRIALING"}
        </p>
      </AnalogInset>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map(({ plan: planId, label, price }) => (
          <MechButton
            key={planId}
            onClick={() => onStartCheckout(planId)}
            disabled={checkoutIsPending}
            className="h-auto flex-col gap-1 py-3"
          >
            <span className="text-sm">{label}</span>
            <MonoLabel>{price}</MonoLabel>
          </MechButton>
        ))}
      </div>
    </AnalogCard>
  );
}
