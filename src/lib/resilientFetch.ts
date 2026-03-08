/**
 * Wraps a Supabase query promise with a timeout and optional retries.
 * Returns the data or null on failure — never throws.
 */
export async function resilientQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<T | null> {
  const { timeoutMs = 10000, retries = 1 } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        queryFn(),
        new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('Query timed out') }), timeoutMs)
        ),
      ]);

      if (result.error) {
        console.warn(`[resilientQuery] attempt ${attempt + 1} error:`, result.error);
        if (attempt < retries) continue;
        return null;
      }
      return result.data;
    } catch (err) {
      console.warn(`[resilientQuery] attempt ${attempt + 1} threw:`, err);
      if (attempt < retries) continue;
      return null;
    }
  }
  return null;
}
