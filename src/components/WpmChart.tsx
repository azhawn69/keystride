import type { WpmSample } from "@/hooks/useTypingEngine";

interface WpmChartProps {
  data: WpmSample[];
}

const WIDTH = 640;
const HEIGHT = 180;
const PAD_L = 32;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 24;

export function WpmChart({ data }: WpmChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        not enough data to chart
      </div>
    );
  }

  const maxWpm = Math.max(...data.map((d) => d.wpm), 10);
  const maxTime = Math.max(...data.map((d) => d.time), 1);
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const x = (t: number) => PAD_L + (t / maxTime) * innerW;
  const y = (w: number) => PAD_T + innerH - (w / maxWpm) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.time)} ${y(d.wpm)}`).join(" ");
  const areaPath = `${linePath} L ${x(data[data.length - 1].time)} ${PAD_T + innerH} L ${x(0)} ${PAD_T + innerH} Z`;

  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Words per minute over time">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = Math.round((maxWpm / yTicks) * i);
        const yy = y(val);
        return (
          <g key={i}>
            <line x1={PAD_L} x2={WIDTH - PAD_R} y1={yy} y2={yy} stroke="currentColor" className="text-border" strokeWidth={1} />
            <text x={PAD_L - 8} y={yy + 3} textAnchor="end" fontSize={10} className="fill-muted-foreground font-mono">
              {val}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="rgb(251 191 36 / 0.08)" />
      <path d={linePath} fill="none" stroke="rgb(251 191 36)" strokeWidth={2} />

      <text x={PAD_L} y={HEIGHT - 6} fontSize={10} className="fill-muted-foreground font-mono">
        0s
      </text>
      <text x={WIDTH - PAD_R} y={HEIGHT - 6} textAnchor="end" fontSize={10} className="fill-muted-foreground font-mono">
        {maxTime}s
      </text>
    </svg>
  );
}
