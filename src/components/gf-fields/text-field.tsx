"use client";

import { ScalarInput, type GfFieldProps } from "./shared";

/** GF `text` / `website` / unknown scalar → text input. */
export function TextField(props: GfFieldProps) {
  return <ScalarInput {...props} type={props.field.type === "website" ? "url" : "text"} />;
}
