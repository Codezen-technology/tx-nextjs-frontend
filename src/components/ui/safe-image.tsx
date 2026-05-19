import Image, { type ImageProps } from "next/image";
import { isRenderableImageSrc } from "@/lib/utils/image";

type SafeImageProps = ImageProps;

/** Renders `next/image` only when `src` is a non-empty string; avoids optimizer crashes on null/invalid src. */
export function SafeImage({ src, alt, ...props }: SafeImageProps) {
  if (!isRenderableImageSrc(src)) {
    return null;
  }
  return <Image src={src} alt={alt} {...props} />;
}
