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
    }

    struct Labels: Decodable {
        let today: String
        let goalReached: String
        let paused: String
        let ready: String
        let finished: String
    }

    /// Début (ms) du jour auquel se rapporte `focusMinutes`.
    let dayStart: Double
    let focusMinutes: Int
    let goalMinutes: Int
    let timer: Timer
    let labels: Labels
    let rtl: Bool

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
        timer: Timer(state: "idle", name: "Pomodoro", color: "#8b6fd6", endAt: nil, remainingSeconds: nil),
        labels: Labels(today: "Focus", goalReached: "✓", paused: "Pause", ready: "Pomodoro", finished: "✓"),
        rtl: false
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
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PomodoroEntry {
        PomodoroEntry(date: Date(), state: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (PomodoroEntry) -> Void) {
        completion(PomodoroEntry(date: Date(), state: WidgetState.load() ?? .sample))
    }

    /// Entrées : maintenant, à la fin du décompte et à minuit (remise à zéro du focus du jour).
    /// L'app demande un rechargement à chaque changement ; entre deux, le décompte s'affiche seul.
    func getTimeline(in context: Context, completion: @escaping (Timeline<PomodoroEntry>) -> Void) {
        let now = Date()
        let state = WidgetState.load() ?? .sample
        let current = PomodoroEntry(date: now, state: state)
        var dates = [now]
        if current.isRunning, let end = current.endDate {
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

// MARK: - Vues

private let goalColor = Color(red: 0.36, green: 0.62, blue: 0.71)
private let reachedColor = Color(red: 0.34, green: 0.70, blue: 0.48)

extension Color {
    /// Couleur « #rrggbb » envoyée par l'app (couleur du mode).
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0x8B6FD6
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

private func formatSeconds(_ seconds: Double) -> String {
    let total = Int(seconds.rounded(.up))
    return String(format: "%02d:%02d", total / 60, total % 60)
}

/// Anneau de progression vers l'objectif quotidien.
struct GoalRing: View {
    let entry: PomodoroEntry
    var lineWidth: CGFloat = 9

    var body: some View {
        let reached = entry.progress >= 1
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.2), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(reached ? reachedColor : goalColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(entry.focusMinutes)")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Text("/ \(entry.state.goalMinutes) min")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .environment(\.layoutDirection, .leftToRight)
        }
    }
}

/// Mode en cours et temps restant (décompte natif, sans réveiller l'app).
struct TimerStatus: View {
    let entry: PomodoroEntry

    var body: some View {
        let timer = entry.state.timer
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle()
                    .fill(Color(hex: timer.color))
                    .frame(width: 10, height: 10)
                Text(timer.name)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
            }
            if entry.isRunning, let end = entry.endDate {
                Text(timerInterval: entry.date...end, countsDown: true)
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color(hex: timer.color))
                    .environment(\.layoutDirection, .leftToRight)
            } else if entry.isPaused, let left = timer.remainingSeconds {
                Text(formatSeconds(left))
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
                    .environment(\.layoutDirection, .leftToRight)
                Text(entry.state.labels.paused)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            } else {
                Text(entry.isFinished ? entry.state.labels.finished : entry.state.labels.ready)
                    .font(.title3.weight(.bold))
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Fine barre d'objectif, sous le décompte du petit widget.
struct GoalBar: View {
    let entry: PomodoroEntry

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.secondary.opacity(0.2))
                Capsule()
                    .fill(entry.progress >= 1 ? reachedColor : goalColor)
                    .frame(width: geo.size.width * entry.progress)
            }
        }
        .frame(height: 6)
    }
}

struct PomodoroWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PomodoroEntry

    var body: some View {
        content
            .environment(\.layoutDirection, entry.state.rtl ? .rightToLeft : .leftToRight)
            .containerBackground(for: .widget) { Color(.systemBackground) }
    }

    @ViewBuilder private var content: some View {
        switch family {
        case .systemMedium:
            HStack(spacing: 16) {
                VStack(spacing: 6) {
                    GoalRing(entry: entry)
                    Text(entry.progress >= 1 ? entry.state.labels.goalReached : entry.state.labels.today)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                .frame(width: 104)
                TimerStatus(entry: entry)
            }
        default:
            if entry.isActive {
                VStack(alignment: .leading, spacing: 8) {
                    TimerStatus(entry: entry)
                    Spacer(minLength: 0)
                    GoalBar(entry: entry)
                }
            } else {
                VStack(spacing: 6) {
                    GoalRing(entry: entry)
                    Text(entry.progress >= 1 ? entry.state.labels.goalReached : entry.state.labels.today)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
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
        .description("Minuteur en cours et objectif de focus du jour.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct PomodoroWidgetBundle: WidgetBundle {
    var body: some Widget {
        PomodoroWidget()
    }
}
