"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number>();

  useEffect(() => {
    setYear(new Date().getFullYear());
  });

  return (
    <footer className="border-t border-gray-500">
      <p className="w-full text-center p-4 ">Copyright (c) {year} . All Rights Reserved.</p>
    </footer>
  );
}
