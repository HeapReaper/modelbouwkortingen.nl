"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsPoint } from "@/lib/analytics";

const config = {
  views: { label: "Paginaweergaven", color: "var(--chart-1)" },
  visitors: { label: "Bezoekers", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Period = "day" | "week" | "month";

const dayFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthFmt = new Intl.DateTimeFormat("nl-NL", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const LABEL: Record<Period, (key: string) => string> = {
  day: (k) => dayFmt.format(new Date(k)),
  week: (k) => `wk ${dayFmt.format(new Date(k))}`,
  month: (k) => monthFmt.format(new Date(`${k}-01`)),
};

/** Paginaweergaven en bezoekers per dag (30), week (12) of maand (12). */
export function AnalyticsChart({
  daily,
  weekly,
  monthly,
}: {
  daily: AnalyticsPoint[];
  weekly: AnalyticsPoint[];
  monthly: AnalyticsPoint[];
}) {
  const [period, setPeriod] = useState<Period>("day");
  const data = { day: daily, week: weekly, month: monthly }[period];
  const label = LABEL[period];
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="day">Per dag</TabsTrigger>
          <TabsTrigger value="week">Per week</TabsTrigger>
          <TabsTrigger value="month">Per maand</TabsTrigger>
        </TabsList>
      </Tabs>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="key"
            tickFormatter={label}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent labelFormatter={(k) => label(String(k))} />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="views" fill="var(--color-views)" radius={4} />
          <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
