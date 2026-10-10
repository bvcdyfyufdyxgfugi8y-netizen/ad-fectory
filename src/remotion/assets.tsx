import { createContext, useContext } from "react";
import { staticFile } from "remotion";
export const AssetBase = createContext("");
export function useAssetUrl() {
  const base = useContext(AssetBase);
  return (src: string) => base ? `${base}/${src}` : staticFile(src);
}
