/** A short message that survives one page change, such as "Plan deleted." after leaving a plan. */
let message = "";

export function setFlash(text: string): void {
  message = text;
}

export function peekFlash(): string {
  return message;
}

export function clearFlash(): void {
  message = "";
}
