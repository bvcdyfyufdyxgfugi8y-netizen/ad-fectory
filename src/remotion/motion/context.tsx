import { createContext, useContext } from "react";
import { settings } from "../../engine/config.ts";
export const MotionSettings = createContext(settings());
export const useMotionSettings = () => useContext(MotionSettings);
