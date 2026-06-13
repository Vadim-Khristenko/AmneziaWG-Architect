/**
 * Russian pluralization. `forms` = [one, few, many]:
 *   pluralRu(1, ["ключ","ключа","ключей"]) → "ключ"
 *   pluralRu(2, …) → "ключа"
 *   pluralRu(5, …) → "ключей"
 *   pluralRu(11, …) → "ключей"  (teens are always "many")
 */
export function pluralRu(
  n: number,
  forms: [string, string, string],
): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
