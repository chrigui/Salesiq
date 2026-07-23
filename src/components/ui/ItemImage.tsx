"use client";

import { useState } from "react";
import { itemGradient, cx } from "./primitives";

/**
 * Property/product imagery with a graceful fallback: the brand gradient always
 * paints underneath, and a real photo fades in over it when available. If the
 * photo URL fails (blocked host, bad link), we simply keep the gradient — the
 * customer never sees a broken-image icon.
 */
export function ItemImage({
  image,
  photo,
  className,
  children,
  rounded,
}: {
  image: string;
  photo?: string;
  className?: string;
  children?: React.ReactNode;
  rounded?: string;
}) {
  const [ok, setOk] = useState(true);
  return (
    <div
      className={cx(
        "relative overflow-hidden bg-gradient-to-br",
        itemGradient(image),
        rounded,
        className,
      )}
    >
      {photo && ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      )}
      {children}
    </div>
  );
}
