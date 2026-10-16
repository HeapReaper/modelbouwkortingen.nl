"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-orange-500 dark:text-white text-black text-center p-4">
      &copy; {year ?? ""} Alle rechten voorbehouden.
    </footer>
  );
}
