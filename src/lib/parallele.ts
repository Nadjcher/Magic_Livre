/**
 * Exécute des tâches avec au plus `limit` en même temps. fal refuse plus de 10
 * requêtes simultanées par compte (« concurrent requests limit ») : relectures
 * et dessins sont donc étalés.
 */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as T, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
