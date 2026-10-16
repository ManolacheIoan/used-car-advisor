"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { CostAssumptions } from "@/lib/cost";
import { assumptionsFromQuery, assumptionsToQuery } from "@/lib/validation";

/** Cost assumptions live in the URL so results, compare and detail stay consistent and shareable. */
export function useUrlAssumptions(): [
  CostAssumptions,
  (a: CostAssumptions) => void,
  URLSearchParams,
] {
  const params = useSearchParams();
  const query = useMemo(() => new URLSearchParams(params.toString()), [params]);
  const assumptions = useMemo(() => assumptionsFromQuery(query), [query]);
  const set = useCallback(
    (a: CostAssumptions) => {
      const q = assumptionsToQuery(a, new URLSearchParams(query));
      window.history.replaceState(null, "", `?${q}`);
    },
    [query],
  );
  return [assumptions, set, query];
}
