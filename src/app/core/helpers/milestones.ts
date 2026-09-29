import {
  FINAL_WARNING_MINUTES, LONG_SESSION_MINUTES, MILESTONES, type MilestoneTone
} from '../constants/timer.constants';

/**
 * Un palier : le moment où il sonne, et le timbre qu'il emprunte.
 *
 * Le timbre vient du rang, jamais du nombre de minutes : le dernier palier porte
 * toujours le son (et le motif de vibration) le plus insistant, l'avant-dernier celui
 * du milieu. C'est cette progression qui se reconnaît sans regarder l'écran, et elle
 * doit rester la même que la session dure dix minutes ou une heure.
 */
export interface Milestone {
  /** Minutes restantes auxquelles le palier se déclenche. */
  minutes: number;
  /** Timbre emprunté : son, motif de vibration et canal de notification. */
  tone: MilestoneTone;
}

/**
 * Paliers d'une session, calculés sur sa durée.
 *
 * Des paliers fixes à 45 / 30 / 15 minutes ne préviennent que les longues sessions :
 * un Pomodoro de 25 min ne reçoit que celui des 15 minutes — au bout de dix minutes,
 * puis plus rien jusqu'au carillon — et une étape de routine de 10 min n'en reçoit
 * aucun. Or l'avertissement avant la fin est justement ce dont dépend une transition
 * qui ne se subit pas.
 *
 * Au-delà de `LONG_SESSION_MINUTES`, les trois paliers connus sont donc conservés tels
 * quels ; en dessous, ils se déduisent de la durée : la moitié, le dernier quart, puis
 * une minute avant la fin.
 *
 * | Durée  | Paliers (minutes restantes) |
 * | ------ | --------------------------- |
 * | 60 min | 45, 30, 15                  |
 * | 25 min | 13, 6, 1                    |
 * | 10 min | 5, 3, 1                     |
 * | 2 min  | 1                           |
 * | 1 min  | aucun                       |
 */
export function milestonesFor(totalSeconds: number): Milestone[] {
  const total = totalSeconds / 60;
  const marks = total > LONG_SESSION_MINUTES
    ? [...MILESTONES]
    : [Math.round(total / 2), Math.round(total / 4), FINAL_WARNING_MINUTES];

  // Un palier doit tomber dans la session (une durée de 45 min n'est pas prévenue à 45),
  // et deux paliers arrondis au même nombre de minutes n'en font qu'un
  const kept = [...new Set(marks)]
    .filter(minutes => minutes >= FINAL_WARNING_MINUTES && minutes < total)
    .sort((a, b) => b - a);

  // Les timbres sont pris par la fin : avec deux paliers, ce sont les deux plus insistants
  return kept.map((minutes, i) => ({ minutes, tone: MILESTONES[MILESTONES.length - kept.length + i] }));
}
