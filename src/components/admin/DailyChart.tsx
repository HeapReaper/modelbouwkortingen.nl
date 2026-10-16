"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/admin";

const config = {
  newDeals: { label: "Nieuwe deals", color: "var(--chart-1)" },
  pages: { label: "Pagina's gecrawld", color: "var(--chart-2)" },
} satisfies ChartConfig;

const fmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
});

export function DailyChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(d) => fmt.format(new Date(d))}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
        />
        <YAxis yAxisId="deals" tickLine={false} axisLine={false} width={40} />
        <YAxis
          yAxisId="pages"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(d) => fmt.format(new Date(String(d)))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          yAxisId="deals"
          dataKey="newDeals"
          fill="var(--color-newDeals)"
          radius={4}
        />
        <Bar
          yAxisId="pages"
          dataKey="pages"
          fill="var(--color-pages)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
