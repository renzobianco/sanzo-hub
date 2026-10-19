"use client";

import { useEffect, useState } from "react";

/** true mientras el footer está en pantalla (lo flotante se esconde para no tapar los legales). */
export function useFooterVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);
  return visible;
}
