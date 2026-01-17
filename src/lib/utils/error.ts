export async function catchErrorTyped<T, E extends new (message?: string) => Error>(
  promise: Promise<T>,
  errorsToCatch?: E[]
): Promise<[undefined, T] | [InstanceType<E>]> {
  if (!promise) {
    throw new TypeError("Promise is undefined");
  }
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((error) => {
      if (errorsToCatch == undefined || errorsToCatch.some((e) => error instanceof e))
        return [error];
      throw error;
    });
}

export async function catchErrorTypedForFunction<
  TArgs extends unknown[],
  T,
  E extends new (message?: string) => Error,
>(fn: (...args: TArgs) => Promise<T>, errorsToCatch?: E[]) {
  return async (...args: TArgs): Promise<[undefined, T] | [InstanceType<E>]> => {
    try {
      return [undefined, await fn(...args)];
    } catch (error) {
      if (errorsToCatch == undefined || errorsToCatch.some((e) => error instanceof e))
        return [error] as [InstanceType<E>];
      throw error;
    }
  };
}
