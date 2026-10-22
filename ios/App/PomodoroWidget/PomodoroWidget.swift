import SwiftUI
import WidgetKit

private let appGroup = "group.com.maximejolivet.pomodorotdah"
private let stateKey = "widgetState"

// MARK: - État partagé

/// État écrit par l'app (WidgetBridgePlugin) à chaque changement utile, en JSON.
/// Les libellés arrivent déjà traduits dans la langue choisie dans l'app.
struct WidgetState: Decodable {
    struct Timer: Decodable {
        /// running | paused | idle
        let state: String
        let name: String
        let color: String
        /// Heure de fin (ms depuis 1970) quand le décompte tourne.
        let endAt: Double?
        /// Temps restant (s) quand le décompte est en pause.
        let remainingSeconds: Double?
        /// « seconds » quand l'étape dure moins d'une minute : le cadran gradue alors des secondes.
        let dialUnit: String?
        /// Ce que le cadran montre à l'écriture : durée réglée au repos, temps restant en pause.
        let dialSeconds: Double?

        /// Vrai quand la graduation vaut des secondes, comme `dialUnit` dans l'app.
        var inSeconds: Bool { dialUnit == "seconds" }
    }

    struct Labels: Decodable {
        let today: String
        let goalReached: String
        let paused: String
        let ready: String
        let finished: String
        /// Abréviation de « seconde », affichée sous le bouton quand le cadran compte en secondes.
        let secShort: String?
    }

    /// Début (ms) du jour auquel se rapporte `focusMinutes`.
    let dayStart: Double
    let focusMinutes: Int
    let goalMinutes: Int
    let timer: Timer
    let labels: Labels
    let rtl: Bool
    /// Thème choisi dans l'app. Absent (état écrit par une version plus ancienne) : on suit le système.
    let dark: Bool?

    static func load() -> WidgetState? {
        guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: stateKey),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetState.self, from: data)
    }

    /// Aperçu dans la galerie de widgets, avant la première ouverture de l'app.
    static let sample = WidgetState(
        dayStart: Calendar.current.startOfDay(for: Date()).timeIntervalSince1970 * 1000,
        focusMinutes: 45,
        goalMinutes: 100,
        timer: Timer(
            state: "idle", name: "Pomodoro", color: "#8b6fd6",
            endAt: nil, remainingSeconds: nil, dialUnit: "minutes", dialSeconds: 25 * 60
        ),
        labels: Labels(
            today: "Focus", goalReached: "✓", paused: "Pause",
            ready: "Pomodoro", finished: "✓", secShort: "s"
        ),
        rtl: false,
        dark: nil
    )
}

// MARK: - Timeline

struct PomodoroEntry: TimelineEntry {
    let date: Date
    let state: WidgetState

    /// Minutes de focus du jour affiché : 0 si l'app n'a rien écrit depuis minuit.
    var focusMinutes: Int {
        let today = Calendar.current.startOfDay(for: date)
        return Date(timeIntervalSince1970: state.dayStart / 1000) < today ? 0 : state.focusMinutes
    }

    var progress: Double {
        guard state.goalMinutes > 0 else { return 0 }
        return min(1, Double(focusMinutes) / Double(state.goalMinutes))
    }

    var endDate: Date? {
        state.timer.endAt.map { Date(timeIntervalSince1970: $0 / 1000) }
    }

    var isRunning: Bool {
        guard state.timer.state == "running", let end = endDate else { return false }
        return end > date
    }

    var isPaused: Bool { state.timer.state == "paused" }

    /// Le décompte a atteint 0 depuis la dernière mise à jour par l'app.
    var isFinished: Bool { state.timer.state == "running" && !isRunning }

    var isActive: Bool { isRunning || isPaused }

    /// Secondes restantes à cette date : déduites de l'heure de fin, sinon telles qu'écrites.
    var secondsLeft: Double {
        if let end = endDate, state.timer.state == "running" {
            return max(0, end.timeIntervalSince(date))
        }
        return state.timer.remainingSeconds ?? state.timer.dialSeconds ?? 0
    }

    /// Ce que le cadran gradue, toujours de 0 à 60 : des secondes ou des minutes (`displayUnits`).
    var dialUnits: Double {
        let left = secondsLeft
        return min(60, state.timer.inSeconds ? left : left / 60)
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PomodoroEntry {
        PomodoroEntry(date: Date(), state: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (PomodoroEntry) -> Void) {
        completion(PomodoroEntry(date: Date(), state: WidgetState.load() ?? .sample))
    }

    /**
     Entrées : maintenant, chaque graduation franchie jusqu'à la fin, la fin elle-même, et
     minuit (remise à zéro du focus du jour). Le disque du cadran se vide donc tout seul,
     graduation par graduation, sans réveiller l'app - comme le vrai cadran sous les yeux.
     */
    func getTimeline(in context: Context, completion: @escaping (Timeline<PomodoroEntry>) -> Void) {
        let now = Date()
        let state = WidgetState.load() ?? .sample
        let current = PomodoroEntry(date: now, state: state)
        var dates = [now]

        if current.isRunning, let end = current.endDate {
            // Une graduation vaut une minute, ou une seconde sur un cadran gradué en secondes.
            let step: TimeInterval = state.timer.inSeconds ? 1 : 60
            var tick = end.addingTimeInterval(-step)
            // 58 marches au plus : au-delà, le système tronque la timeline de toute façon.
            while tick > now && dates.count < 58 {
                dates.append(tick)
                tick = tick.addingTimeInterval(-step)
            }
            dates.append(end)
        }

        let calendar = Calendar.current
        if let midnight = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) {
            dates.append(midnight)
        }
        let entries = dates.sorted().map { PomodoroEntry(date: $0, state: state) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Palette

extension Color {
    /// Couleur « #rrggbb » envoyée par l'app (couleur du mode), ou jeton du thème.
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0x8B6FD6
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

/// Les jetons de `src/theme/tokens.css` et `dark.css`, repris tels quels : le widget et
/// l'app doivent être de la même matière, sinon l'un a l'air d'une copie de l'autre.
struct Palette {
    let face: Color
    let faceHi: Color
    let faceLo: Color
    let ink: Color
    let muted: Color
    let surfaceHi: Color
    let surfaceLo: Color
    let surfaceEdge: Color
    let track: Color
    let tab: Color
    let bar: Color

    static let light = Palette(
        face: Color(hex: "#f5f2ea"), faceHi: Color(hex: "#fbfaf6"), faceLo: Color(hex: "#e6e1d3"),
        ink: Color(hex: "#1d2b3a"), muted: Color(hex: "#5b6b7a"),
        surfaceHi: Color(hex: "#fbfaf6"), surfaceLo: Color(hex: "#e6e1d3"),
        surfaceEdge: Color(hex: "#b9c3c6"), track: Color(hex: "#e4ddcc"),
        tab: Color(hex: "#1d2b3a"), bar: Color(hex: "#8b6fd6")
    )

    static let dark = Palette(
        face: Color(hex: "#22272c"), faceHi: Color(hex: "#2a3036"), faceLo: Color(hex: "#181b1f"),
        ink: Color(hex: "#e8ecee"), muted: Color(hex: "#a0abb1"),
        surfaceHi: Color(hex: "#2e343a"), surfaceLo: Color(hex: "#23282d"),
        surfaceEdge: Color(hex: "#121518"), track: Color(hex: "#15181b"),
        tab: Color(hex: "#e8ecee"), bar: Color(hex: "#8b6fd6")
    )
}

// MARK: - Géométrie du cadran

/// Port de `src/app/features/timer/dial-geometry.ts` : mêmes constantes, même repère
/// 420 × 420, même sens anti-horaire depuis 0. Le cadran du widget est le cadran de l'app.
private enum Dial {
    static let size: CGFloat = 420
    static let cx: CGFloat = 210
    static let cy: CGFloat = 210
    static let ringOuter: CGFloat = 150
    static let ringInner: CGFloat = 102
    static let diskR: CGFloat = 138
    static let labelR: CGFloat = 180

    /// Douze segments pastel, de 0-5 min à 55-60 min : les mêmes que `SEGMENT_COLORS` dans l'app.
    static let segmentColors = [
        "#f7b3b3", "#f8c9a6", "#f9e4a0", "#d7eca0", "#b5e6b5", "#a8e6d4",
        "#a6dcea", "#b1cff5", "#c3c0f5", "#d4bff2", "#efbbe8", "#f5b8c8"
    ].map(Color.init(hex:))

    static let center = CGPoint(x: cx, y: cy)

    /// Point à un rayon donné, pour une valeur de 0 à 60 (sens anti-horaire depuis le haut).
    static func point(_ r: CGFloat, _ units: Double) -> CGPoint {
        let rad = -units * 6 * .pi / 180
        return CGPoint(x: cx + r * CGFloat(sin(rad)), y: cy - r * CGFloat(cos(rad)))
    }

    /// Angle (radians, sens horaire depuis le haut) du bord du disque.
    static func angle(_ units: Double) -> CGFloat {
        CGFloat(-units * 6 * .pi / 180)
    }

    /// Secteur plein de 0 jusqu'à `units`, comme `sectorPath`.
    static func sector(r: CGFloat, units: Double) -> Path {
        var path = Path()
        guard units > 0 else { return path }
        if units >= 60 {
            path.addEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
            return path
        }
        path.move(to: center)
        path.addLine(to: CGPoint(x: cx, y: cy - r))
        path.addArc(
            center: center, radius: r,
            startAngle: .degrees(-90), endAngle: .degrees(-90 - units * 6),
            clockwise: true
        )
        path.closeSubpath()
        return path
    }

    /// Un des douze segments de l'anneau, comme `annulusPath`.
    static func segment(from: Double, to: Double) -> Path {
        var path = Path()
        path.move(to: point(ringOuter, from))
        path.addArc(
            center: center, radius: ringOuter,
            startAngle: .degrees(-90 - from * 6), endAngle: .degrees(-90 - to * 6),
            clockwise: true
        )
        path.addLine(to: point(ringInner, to))
        path.addArc(
            center: center, radius: ringInner,
            startAngle: .degrees(-90 - to * 6), endAngle: .degrees(-90 - from * 6),
            clockwise: false
        )
        path.closeSubpath()
        return path
    }

    /// Le repère du widget : un rond de 60 centré sur le rayon 180, tourné à la valeur courante.
    static func pointerTab(units: Double) -> Path {
        let path = Path(ellipseIn: CGRect(x: -30, y: -210, width: 60, height: 60))
        let transform = CGAffineTransform(translationX: cx, y: cy).rotated(by: angle(units))
        return path.applying(transform)
    }
}

/// La face du minuteur : anneau de couleurs, disque du mode, graduations et bouton central.
/// Dessinée dans un `Canvas` : un seul repère à l'échelle, et aucun surcoût de vues.
struct DialFace: View {
    /// Ce que le cadran montre, de 0 à 60.
    let units: Double
    let color: Color
    let palette: Palette
    /// L'unité, seulement quand ce ne sont plus des minutes : sinon 20 secondes se lit 20 minutes.
    let secondsLabel: String?

    var body: some View {
        Canvas { ctx, size in
            let scale = min(size.width, size.height) / Dial.size
            ctx.scaleBy(x: scale, y: scale)

            for (i, segmentColor) in Dial.segmentColors.enumerated() {
                ctx.fill(Dial.segment(from: Double(i) * 5, to: Double(i + 1) * 5), with: .color(segmentColor))
            }

            // Disque : voile sur l'anneau, puis plateau plein au centre. Le voile multiplie,
            // comme `mix-blend-mode: multiply` dans l'app : l'anneau transparaît sous le mode.
            if units > 0 {
                var veil = ctx
                veil.blendMode = .multiply
                veil.fill(Dial.sector(r: Dial.diskR, units: units), with: .color(color.opacity(0.92)))
                ctx.fill(
                    Dial.sector(r: Dial.ringInner, units: units),
                    with: .radialGradient(
                        Gradient(colors: [color.opacity(0.85), color]),
                        center: CGPoint(x: Dial.cx, y: Dial.cy - Dial.ringInner * 0.2),
                        startRadius: 0, endRadius: Dial.ringInner * 1.3
                    )
                )
            }

            // Séparateurs : de la couleur de la face, comme douze fentes dans l'anneau.
            for i in 0..<12 {
                var line = Path()
                line.move(to: Dial.point(Dial.ringInner - 2, Double(i) * 5))
                line.addLine(to: Dial.point(Dial.ringOuter + 1, Double(i) * 5))
                ctx.stroke(line, with: .color(palette.face), lineWidth: 4)
            }

            // Bord du disque : le trait blanc qui dit où en est le temps.
            if units > 0 && units < 60 {
                var edge = Path()
                edge.move(to: Dial.center)
                edge.addLine(to: Dial.point(Dial.diskR, units))
                ctx.stroke(edge, with: .color(.white.opacity(0.9)), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
            }

            // Repère : carré en haut, demi-cercle en bas, à la couleur du mode (comme `tabColor` dans l'app).
            ctx.fill(Dial.pointerTab(units: units), with: .color(color))

            for i in 0..<12 {
                let text = Text(String(i * 5))
                    .font(.system(size: 22, weight: .semibold, design: .rounded))
                    .foregroundStyle(palette.ink)
                ctx.draw(ctx.resolve(text), at: Dial.point(Dial.labelR, Double(i) * 5), anchor: .center)
            }

            if let secondsLabel {
                let text = Text(secondsLabel.uppercased())
                    .font(.system(size: 21, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.muted)
                ctx.draw(ctx.resolve(text), at: CGPoint(x: Dial.cx, y: Dial.cy + 66), anchor: .center)
            }

            // Bouton central : joint encre, capuchon blanc comme l'aiguille de l'app.
            ctx.fill(circle(r: 31), with: .color(palette.ink))
            ctx.fill(circle(r: 26), with: .color(.white))
        }
        .aspectRatio(1, contentMode: .fit)
        // Le cadran ne se lit pas de gauche à droite : en arabe aussi, 0 reste en haut.
        .environment(\.layoutDirection, .leftToRight)
        // Le cadran est une image du temps ; le texte à côté le dit déjà pour VoiceOver.
        .accessibilityHidden(true)
    }

    private func circle(r: CGFloat) -> Path {
        Path(ellipseIn: CGRect(x: Dial.cx - r, y: Dial.cy - r, width: r * 2, height: r * 2))
    }
}

// MARK: - Vues

private func formatSeconds(_ seconds: Double) -> String {
    let total = Int(seconds.rounded(.up))
    return String(format: "%02d:%02d", total / 60, total % 60)
}

/// Le temps, en gros chiffres : décompte natif quand ça tourne, valeur figée sinon.
struct TimeText: View {
    let entry: PomodoroEntry
    let size: CGFloat

    var body: some View {
        Group {
            if entry.isRunning, let end = entry.endDate {
                Text(timerInterval: entry.date...end, countsDown: true)
            } else {
                Text(formatSeconds(entry.secondsLeft))
            }
        }
        .font(.system(size: size, weight: .bold, design: .rounded))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .environment(\.layoutDirection, .leftToRight)
    }
}

/// La pastille de lecture de l'app : temps et mode, posés sur une capsule en relief.
struct ReadoutPill: View {
    let entry: PomodoroEntry
    let palette: Palette

    var body: some View {
        let timer = entry.state.timer
        HStack(spacing: 6) {
            Circle()
                .fill(Color(hex: timer.color))
                .frame(width: 7, height: 7)
            TimeText(entry: entry, size: 17)
                .foregroundStyle(palette.ink)
                .layoutPriority(1)
            Text(entry.isFinished ? entry.state.labels.finished : timer.name)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .frame(maxWidth: .infinity)
        .background(
            Capsule().fill(
                LinearGradient(colors: [palette.surfaceHi, palette.surfaceLo], startPoint: .top, endPoint: .bottom)
            )
        )
        .overlay(Capsule().strokeBorder(palette.surfaceEdge.opacity(0.7), lineWidth: 0.5))
        .shadow(color: palette.surfaceEdge, radius: 0, y: 2)
        .accessibilityElement(children: .combine)
    }
}

/// Fine barre de temps : la part restante du minuteur, sur la même échelle que le cadran.
struct GoalBar: View {
    let fraction: Double
    let color: Color
    let palette: Palette

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(palette.track)
                Capsule()
                    .fill(color)
                    .frame(width: geo.size.width * fraction)
            }
        }
        .frame(height: 6)
    }
}

/// Barre de temps sous le cadran : vide à l'arrêt, elle se vide avec le décompte.
struct GoalRow: View {
    let entry: PomodoroEntry
    let palette: Palette

    var body: some View {
        GoalBar(
            fraction: entry.isActive ? min(1, entry.dialUnits / 60) : 0,
            color: Color(hex: entry.state.timer.color),
            palette: palette
        )
    }
}

struct PomodoroWidgetView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var colorScheme
    let entry: PomodoroEntry

    /// Le thème de l'app prime : un widget clair sous une app sombre trahirait la même main.
    private var palette: Palette {
        (entry.state.dark ?? (colorScheme == .dark)) ? .dark : .light
    }

    private var dial: DialFace {
        DialFace(
            units: entry.dialUnits,
            color: Color(hex: entry.state.timer.color),
            palette: palette,
            secondsLabel: entry.state.timer.inSeconds ? entry.state.labels.secShort : nil
        )
    }

    var body: some View {
        content
            .environment(\.layoutDirection, entry.state.rtl ? .rightToLeft : .leftToRight)
            .containerBackground(for: .widget) {
                // La face du boîtier : même dégradé radial que `.face` dans l'app.
                RadialGradient(
                    colors: [palette.faceHi, palette.face, palette.faceLo],
                    center: UnitPoint(x: 0.4, y: 0.3), startRadius: 0, endRadius: 220
                )
            }
    }

    @ViewBuilder private var content: some View {
        switch family {
        case .systemMedium:
            HStack(spacing: 12) {
                dial
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: entry.state.timer.color))
                            .frame(width: 10, height: 10)
                        Text(entry.state.timer.name)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(palette.ink)
                            .lineLimit(1)
                    }
                    if entry.isActive {
                        TimeText(entry: entry, size: 38)
                            .foregroundStyle(entry.isPaused ? palette.muted : Color(hex: entry.state.timer.color))
                        if entry.isPaused {
                            Text(entry.state.labels.paused)
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(palette.muted)
                        }
                    } else {
                        Text(entry.isFinished ? entry.state.labels.finished : entry.state.labels.ready)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(palette.ink)
                            .lineLimit(2)
                    }
                    Spacer(minLength: 6)
                    GoalRow(entry: entry, palette: palette)
                }
            }
            .padding(14)
        default:
            VStack(spacing: 6) {
                dial
                ReadoutPill(entry: entry, palette: palette)
            }
            .padding(10)
        }
    }
}

// MARK: - Widget

struct PomodoroWidget: Widget {
    let kind = "PomodoroWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PomodoroWidgetView(entry: entry)
        }
        .configurationDisplayName("Pomodoro Accessibilité")
        .description("Le cadran du minuteur et l'objectif de focus du jour.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

@main
struct PomodoroWidgetBundle: WidgetBundle {
    var body: some Widget {
        PomodoroWidget()
        // La Live Activity vit dans la même extension que le widget, et n'existe qu'à
        // partir d'iOS 16.2 - l'extension, elle, demande déjà iOS 17.
        PomodoroLiveActivity()
    }
}
