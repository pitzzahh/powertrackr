import { isHttpError } from "@sveltejs/kit";
import { showLoading, showSuccess, showWarning } from "#lib/components/toast/index.js";

type NotifyResult = {
  run: () => Promise<unknown>;
  /** Field issues the remote form reported after `run`. */
  issues?: () => { message: string }[] | undefined;
  success: string;
  successDetail?: string;
  failure: string;
  /** Show a loading toast while `run` is pending; the outcome replaces it. */
  loading?: string;
};

/**
 * Run a remote form/command and toast the outcome. Resolves true only when it
 * succeeded with no field issues. HTTP errors show the server's message.
 */
export async function notifyResult(opts: NotifyResult): Promise<boolean> {
  const id = opts.loading ? showLoading(opts.loading) : undefined;
  const replace = id === undefined ? undefined : { id };
  try {
    await opts.run();
    const issues = opts.issues?.() ?? [];
    if (issues.length > 0) {
      showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, replace);
      return false;
    }
    showSuccess(opts.success, opts.successDetail, undefined, replace);
    return true;
  } catch (e) {
    showWarning((isHttpError(e) && e.body.message) || opts.failure, undefined, undefined, replace);
    return false;
  }
}
