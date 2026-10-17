"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useI18n } from "@/i18n/client";
import type { PricePoint } from "@/lib/deals";

export function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  const { dict, fmt } = useI18n();
  const config = {
    price: { label: dict.product.chartPrice, color: "var(--chart-1)" },
  } satisfies ChartConfig;
  // Laat de lijn doorlopen tot vandaag.
  const data = [
    ...points.map((p) => ({ t: new Date(p.date).getTime(), price: p.price })),
  ];
  if (data.length > 0)
    data.push({ t: Date.now(), price: data[data.length - 1].price });

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(t) => fmt.shortDate(new Date(t))}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <YAxis
          dataKey="price"
          tickFormatter={(v) => `€${Math.round(v)}`}
          tickLine={false}
          axisLine={false}
          width={56}
          domain={["auto", "auto"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const t = payload?.[0]?.payload?.t;
                return t ? fmt.shortDate(new Date(t)) : "";
              }}
              formatter={(value) => fmt.euro(Number(value))}
            />
          }
        />
        <Line
          dataKey="price"
          type="stepAfter"
          stroke="var(--color-price)"
          strokeWidth={3}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
