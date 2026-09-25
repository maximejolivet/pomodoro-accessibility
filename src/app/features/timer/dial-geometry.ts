/**
 * Géométrie du cadran (viewBox 420 × 420) : constantes, chemins SVG et conversion
 * pointeur → minutes. Fonctions pures, sans état ni dépendance à Angular.
 */

export const CX = 217;
export const CY = 218;
export const RING_OUTER = 150;
export const RING_INNER = 102;
export const DISK_R = 147;
export const LABEL_R = 181;
/** Effet d'arrière-plan de 0 à 20, comme sur le Time Timer */
export const BG_R = 212;
export const BG_TO_MIN = 20;
/** Le bout arrondi dépasse le 0 (valeur négative = côté 55) */
const BG_CAP_PAST_ZERO_MIN = 1.8;
/** Le cadran est réduit pour laisser la place à l'arc au-dessus des chiffres */
const DIAL_SCALE = 0.91;
export const DIAL_TRANSFORM =
  `translate(${CX} ${CY}) scale(${DIAL_SCALE}) translate(${-CX} ${-CY})`;

/** Couleurs des segments, de 0-5 min (rouge) à 55-60 min (magenta) */
export const SEGMENT_COLORS = [
  '#d63f4f', '#e5593a', '#ef7d2d', '#f3a52b', '#f0c52f', '#c3cd36',
  '#56b27b', '#5d9fb6', '#5d6db3', '#5a55a3', '#6c4b9c', '#b24f97'
];

/** Point à un rayon donné, pour une valeur en minutes (sens anti-horaire depuis 0). */
export function point(r: number, minutes: number): { x: number; y: number } {
  const rad = (-minutes * 6 * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

export function sectorPath(r: number, minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes >= 60) {
    return `M ${CX} ${CY - r} A ${r} ${r} 0 1 0 ${CX} ${CY + r} A ${r} ${r} 0 1 0 ${CX} ${CY - r} Z`;
  }
  const end = point(r, minutes);
  const large = minutes > 30 ? 1 : 0;
  return `M ${CX} ${CY} L ${CX} ${CY - r} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

export function arcBetween(r: number, fromMin: number, toMin: number): string {
  const start = point(r, fromMin);
  const end = point(r, toMin);
  const large = toMin - fromMin > 30 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function annulusPath(
  fromMin: number,
  toMin: number,
  outer = RING_OUTER,
  inner = RING_INNER
): string {
  const o0 = point(outer, fromMin);
  const o1 = point(outer, toMin);
  const i1 = point(inner, toMin);
  const i0 = point(inner, fromMin);
  const large = toMin - fromMin > 30 ? 1 : 0;
  return `M ${o0.x} ${o0.y} A ${outer} ${outer} 0 ${large} 0 ${o1.x} ${o1.y} ` +
    `L ${i1.x} ${i1.y} A ${inner} ${inner} 0 ${large} 1 ${i0.x} ${i0.y} Z`;
}

/** Minute où commence la partie droite de la bande, pour que son bout arrondi dépasse le 0. */
const BG_CAP_MINUTES = (() => {
  const capR = (BG_R - RING_OUTER) / 2;
  const midR = (BG_R + RING_OUTER) / 2;
  return (capR / midR) * (180 / Math.PI) / 6 - BG_CAP_PAST_ZERO_MIN;
})();

/** Bande de 0 à 20 avec un bout arrondi côté 0 (remplie, ou seulement son contour). */
function roundedBandPath(closed: boolean): string {
  const capR = (BG_R - RING_OUTER) / 2;
  const m = BG_CAP_MINUTES;
  const inner = point(RING_OUTER, m);
  const outer = point(BG_R, m);
  const outerEnd = point(BG_R, BG_TO_MIN);
  const contour = `M ${inner.x} ${inner.y} A ${capR} ${capR} 0 0 0 ${outer.x} ${outer.y} ` +
    `A ${BG_R} ${BG_R} 0 0 0 ${outerEnd.x} ${outerEnd.y}`;
  if (!closed) return contour;
  const innerEnd = point(RING_OUTER, BG_TO_MIN);
  return `${contour} L ${innerEnd.x} ${innerEnd.y} A ${RING_OUTER} ${RING_OUTER} 0 0 1 ${inner.x} ${inner.y} Z`;
}

/** Les 12 segments de couleur de l'anneau. */
export const DIAL_SEGMENTS = SEGMENT_COLORS.map((color, i) => ({
  color,
  d: annulusPath(i * 5, (i + 1) * 5)
}));

/** Les 12 traits de séparation entre segments. */
export const DIAL_SEPARATORS = Array.from({ length: 12 }, (_, i) => {
  const a = point(RING_INNER - 2, i * 5);
  const b = point(RING_OUTER + 1, i * 5);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
});

/** Les graduations chiffrées 0, 5, 10… 55. */
export const DIAL_LABELS = Array.from({ length: 12 }, (_, i) => {
  const p = point(LABEL_R, i * 5);
  return { text: String(i * 5), x: p.x, y: p.y };
});

export const BG_FILL_PATH = roundedBandPath(true);
export const BG_ARC_PATH = roundedBandPath(false);
export const BG_HIGHLIGHT_PATH = arcBetween(BG_R - 1.5, BG_CAP_MINUTES, BG_TO_MIN);
export const BG_FADE = {
  start: point(BG_R, 0),
  end: point(BG_R, BG_TO_MIN)
};

/** Minutes (0-60, sens anti-horaire depuis 0) sous le pointeur, ou null au centre. */
export function minutesAtPointer(svg: SVGSVGElement, event: PointerEvent): number | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
  const dx = pt.x - CX;
  const dy = pt.y - CY;
  if (Math.hypot(dx, dy) < 30) return null;
  const clockwise = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (((-clockwise % 360) + 360) % 360) / 6;
}
