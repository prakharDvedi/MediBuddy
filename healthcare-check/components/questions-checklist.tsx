import { StatusBadge } from "@/components/ui";

export type ChecklistAudience = "hospital" | "insurer";

export type ChecklistItem = {
  id: string;
  question: string;
  context: string;
  audience: ChecklistAudience;
};

function ChecklistGroup({ audience, items }: {
  audience: ChecklistAudience;
  items: ChecklistItem[];
}) {
  if (items.length === 0) return null;

  const isHospital = audience === "hospital";

  return (
    <details open={isHospital} className="group mt-3 first:mt-0">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-info/20 bg-surface/70 px-3 py-3 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
        <span>Questions for the {isHospital ? "hospital" : "insurer"}</span>
        <span className="flex items-center gap-2">
          <StatusBadge tone={isHospital ? "warning" : "info"}>{items.length}</StatusBadge>
          <span aria-hidden="true" className="text-lg font-normal leading-none text-text-muted transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <ul className="mt-2 grid gap-2">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-xl border border-border bg-surface px-3 py-3">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-info-bg text-xs font-semibold text-info">{index + 1}</span>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-text-primary">{item.question}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">Based on: {item.context}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function QuestionsChecklist({ items }: { items: ChecklistItem[] }) {
  const hospitalQuestions = items.filter((item) => item.audience === "hospital");
  const insurerQuestions = items.filter((item) => item.audience === "insurer");

  return (
    <div className="rounded-[1rem] border border-info/20 bg-info-bg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">Take this with you</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">Questions to ask next</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">A final checklist based on the observations above.</p>
        </div>
        <StatusBadge tone="info">{items.length}</StatusBadge>
      </div>

      <div className="mt-5">
        <ChecklistGroup audience="hospital" items={hospitalQuestions} />
        <ChecklistGroup audience="insurer" items={insurerQuestions} />
      </div>
      <p className="mt-5 border-t border-info/20 pt-4 text-xs leading-5 text-text-muted">These are neutral questions based on what MedBud found. They are not conclusions about wrongdoing.</p>
    </div>
  );
}
