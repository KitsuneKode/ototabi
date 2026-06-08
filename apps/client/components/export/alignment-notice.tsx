import { AlertTriangle } from "@/lib/icons";

type AlignmentNoticeProps = {
  warnings: string[];
  keyPrefix?: string;
  className?: string;
};

export function AlignmentNotice({
  warnings,
  keyPrefix = "align",
  className,
}: AlignmentNoticeProps) {
  if (warnings.length === 0) return null;

  return (
    <>
      {warnings.map((warning) => (
        <div
          key={`${keyPrefix}-${warning}`}
          className={
            className ?? "border-led-on/30 bg-led-on/5 flex items-start gap-2 rounded border p-3"
          }
        >
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{warning}</p>
        </div>
      ))}
    </>
  );
}
