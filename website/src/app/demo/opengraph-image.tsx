import { ImageResponse } from "next/og";
import { ogImageElement, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return new ImageResponse(ogImageElement("See SalesIQ against your own use case."), size);
}
