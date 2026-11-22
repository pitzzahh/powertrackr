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
