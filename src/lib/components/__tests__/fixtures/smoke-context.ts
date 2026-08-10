import { createContext } from "svelte";

export const [getSmokeContext, setSmokeContext] = createContext<{ name: string }>();
