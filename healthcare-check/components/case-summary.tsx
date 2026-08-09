import { ImpactCard, MoneyValue, StatusBadge, Surface } from "@/components/ui";

export function CaseSummary({ totalBilled, findingsCount, highCount, mediumOrLowCount, potentialSavings }: {
  totalBilled: number;
  findingsCount: number;
  highCount: number;
  mediumOrLowCount: number;
  potentialSavings: number;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.15fr]">
      <ImpactCard tone="neutral" label="Total bill or estimate" className="bg-surface">
        <MoneyValue value={totalBilled} size="lg" className="mt-2 block text-text-primary" />
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone={findingsCount > 0 ? "warning" : "success"}>{findingsCount > 0 ? `${findingsCount} thing${findingsCount === 1 ? "" : "s"} worth checking` : "Nothing flagged yet"}</StatusBadge>
          {highCount > 0 && <StatusBadge tone="success">{highCount} verified</StatusBadge>}
          {mediumOrLowCount > 0 && <StatusBadge tone="warning">{mediumOrLowCount} need clarification</StatusBadge>}
        </div>
      </ImpactCard>

      {potentialSavings > 0 ? (
        <ImpactCard tone="warning" label="Potential savings to investigate" description="Estimated from the available reference price. This does not guarantee that the amount is recoverable or that the hospital charge is unlawful.">
          <MoneyValue value={potentialSavings} size="lg" className="mt-2 block text-warning" />
        </ImpactCard>
      ) : (
        <Surface tone="info" className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">What happens next</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">Review each finding with its source page.</p>
          <p className="mt-1 text-sm leading-6 text-text-muted">MediBud keeps the interpretation close to the evidence so you can decide what to ask.</p>
        </Surface>
      )}
    </div>
  );
}
