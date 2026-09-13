export default function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(1, ...data.map((d) => d.completed + d.failed));
  const W = 560;
  const H = 180;
  const PAD_BOTTOM = 24;
  const PAD_TOP = 12;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const groupW = W / data.length;
  const barW = Math.min(36, groupW - 12);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Jobs completed and failed per day over the last week"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={0}
          x2={W}
          y1={PAD_TOP + chartH * (1 - f)}
          y2={PAD_TOP + chartH * (1 - f)}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={1}
          strokeDasharray={f === 1 ? "0" : "4 4"}
        />
      ))}

      {data.map((d, i) => {
        const completedH = (d.completed / max) * chartH;
        const failedH = (d.failed / max) * chartH;
        const x = i * groupW + (groupW - barW) / 2;
        const baseY = PAD_TOP + chartH;
        const totalH = completedH + failedH;
        const doneY = baseY - failedH - completedH;

        return (
          <g key={d.day}>
            {totalH > 1 && (
              <rect
                x={x}
                y={baseY - totalH}
                width={barW}
                height={totalH}
                rx={4}
                opacity={0.18}
                className="fill-slate-400 dark:fill-slate-500"
              />
            )}
            {completedH > 0 && (
              <rect
                x={x}
                y={doneY}
                width={barW}
                height={completedH}
                rx={failedH > 0 ? 0 : 4}
                className="fill-emerald-400 dark:fill-emerald-500"
              />
            )}
            {failedH > 0 && (
              <rect
                x={x}
                y={baseY - failedH}
                width={barW}
                height={failedH}
                rx={4}
                className="fill-rose-400 dark:fill-rose-500"
              />
            )}
            <text
              x={x + barW / 2}
              y={H - 7}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] dark:fill-slate-500"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}