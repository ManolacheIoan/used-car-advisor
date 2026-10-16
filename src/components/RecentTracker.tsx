"use client";

import { useEffect } from "react";
import { useRecentList } from "./useLocalList";

/** Records the visited generation page in "Văzute recent" (localStorage only). */
export function RecentTracker({ id }: { id: string }) {
  const { add } = useRecentList();
  useEffect(() => {
    add(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record once per page
  }, [id]);
  return null;
}
