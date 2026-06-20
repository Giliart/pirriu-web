"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";

type SecureImageProps = ImgHTMLAttributes<HTMLImageElement>;

type SecureImageStyle = CSSProperties & {
  WebkitUserDrag?: "none";
};

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
      } as SecureImageStyle}
    />
  );
}
