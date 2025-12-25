import { i18n } from "$lib/i18n"
import type { Reroute } from "@sveltejs/kit"

export const reroute: Reroute = i18n.reroute()