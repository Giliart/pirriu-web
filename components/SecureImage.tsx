"use client";

import type { ImgHTMLAttributes } from "react";

type SecureImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function SecureImage(props: SecureImageProps) {
  return (
    <img
      {...props}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        WebkitUserDrag: "none",
        userSelect: "none",
        ...(props.style || {}),
      }}
    />
  );
}
