import { getContext, hasContext, setContext } from "svelte";
import type { InputOtpInvalidMotion, InputOtpSize } from "./variants";

export type InputOtpStyle = {
	size: InputOtpSize;
	invalid: boolean;
	invalidMotion: InputOtpInvalidMotion;
};

const STYLE = Symbol("input-otp-style");
export const setInputOtpStyle = (get: () => InputOtpStyle) => setContext(STYLE, get);
/** The root's style props, read lazily so a changed prop reaches every slot. */
export const getInputOtpStyle = (): InputOtpStyle =>
	hasContext(STYLE)
		? getContext<() => InputOtpStyle>(STYLE)()
		: { size: "default", invalid: false, invalidMotion: "shake" };
