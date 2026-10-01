export function escapeHtml(value: unknown): string { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!) }
export function nl2br(value: unknown): string { return escapeHtml(value).replace(/\r?\n/g, "<br>") }
export function stripSubjectNewlines(value: unknown): string { return String(value ?? "").replace(/[\r\n]/g, " ") }
