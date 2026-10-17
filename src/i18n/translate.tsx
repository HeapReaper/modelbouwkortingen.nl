import { createElement, Fragment, type ReactNode } from "react";

type Vars = Record<string, string | number>;

/** Vult {naam}-plekken in: t("{count} deals", { count: 3 }) → "3 deals". */
export function t(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in vars ? String(vars[key]) : m,
  );
}

/** Zoals t(), maar de invulplekken mogen React-elementen zijn (links, <code>, …). */
export function rich(
  template: string,
  nodes: Record<string, ReactNode>,
): ReactNode {
  const parts = template.split(/(\{\w+\})/g).map((part) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key && key in nodes ? nodes[key] : part;
  });
  // Als losse children (geen array), dan zijn er geen keys nodig.
  return createElement(Fragment, null, ...parts);
}
