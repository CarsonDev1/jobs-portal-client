export function formatMoney(value) {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const parts = Math.trunc(num).toString().split('');
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const idxFromEnd = parts.length - i - 1;
    out += parts[i];
    if (idxFromEnd > 0 && idxFromEnd % 3 === 0) out += '.';
  }
  return out;
}
