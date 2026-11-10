function datePart(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDraftDate(value: string) {
  const match = /^\d{4}-\d{2}-\d{2}(?=T|$)/.exec(value);
  if (!match) return undefined;
  const date = new Date(`${match[0]}T12:00:00`);
  return !Number.isNaN(date.getTime()) && datePart(date) === match[0] ? date : undefined;
}

export function getDraftTime(value: string) {
  const separator = value.indexOf("T");
  return separator < 0 ? "" : value.slice(separator + 1);
}

export function withDraftDate(value: string, date: Date) {
  return `${datePart(date)}T${getDraftTime(value) || "09:00"}`;
}

export function withDraftTime(value: string, input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  const time = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
  const prefix = getDraftDate(value) ? value.slice(0, 10) : "";
  return `${prefix}T${time}`;
}
