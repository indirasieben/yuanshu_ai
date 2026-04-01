//数字千分号分隔
export function formatNumberWithComma(num) {
  if (num == null) return "--";
  return num.toLocaleString();
}
