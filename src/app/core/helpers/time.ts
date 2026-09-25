/** « 25:00 » à partir d'un nombre de secondes. */
export function formatTime(seconds: number): string {
  const total = Math.ceil(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
