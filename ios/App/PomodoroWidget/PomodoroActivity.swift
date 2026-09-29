import ActivityKit
import Foundation

/**
 Ce qu'une Live Activity du minuteur transporte. Ce fichier appartient aux **deux** cibles —
 l'app qui la demande et l'extension qui la dessine : ActivityKit apparie les deux bouts par
 le type, et deux copies dans deux modules ne s'apparieraient pas.

 iOS 16.2 : c'est la version où `Activity.request(attributes:content:)` prend sa forme
 actuelle. L'app, elle, descend jusqu'à iOS 15 — d'où les gardes partout où on s'en sert.
 */
@available(iOS 16.2, *)
struct PomodoroActivityAttributes: ActivityAttributes {

    /// Ce qui change au fil de la session ; le reste de l'écran n'a pas à être réécrit.
    struct ContentState: Codable, Hashable {
        /// Nom du mode ou de l'étape en cours.
        var name: String
        /// Couleur du mode, « #rrggbb » comme partout ailleurs.
        var colorHex: String
        /// Heure de fin quand le décompte tourne ; nil en pause, où plus rien ne court.
        var endAt: Date?
        /// Temps restant figé, pour la pause et pour ce que le système affiche sans horloge.
        var remainingSeconds: Double
        /// Ce que le cadran montre, de 0 à 60 : dessiné à chaque mise à jour, pas entre deux.
        var dialUnits: Double
        /// Vrai quand la graduation vaut des secondes.
        var inSeconds: Bool
        var paused: Bool
        /// « Pause », déjà traduit : le système ne connaît pas la langue choisie dans l'app.
        var pausedLabel: String
        /// Abréviation de « seconde », pour la pastille d'unité du cadran.
        var secShort: String
        /// Thème choisi dans l'app, pour que la Live Activity ne détonne pas.
        var dark: Bool
    }

    /// Fixe pour toute la durée de l'activité : rien d'utile ici, mais le type l'exige.
    var kind: String = "timer"
}
