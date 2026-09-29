import ActivityKit
import Capacitor
import Foundation

/**
 Le décompte qui reste sous les yeux : une Live Activity sur l'écran verrouillé et dans la
 Dynamic Island. Le jumeau du `LiveStatusPlugin.java` d'Android, qui fait le même travail
 avec une notification permanente.

 L'app reçoit le même JSON que le widget : c'est le même état, montré à un autre endroit.
 */
@objc(LiveStatusPlugin)
public class LiveStatusPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveStatusPlugin"
    public let jsName = "LiveStatus"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise)
    ]

    /// L'état tel que l'app l'écrit : on n'en lit ici que ce que l'écran verrouillé montre.
    private struct Snapshot: Decodable {
        struct Timer: Decodable {
            let state: String
            let name: String
            let color: String
            let endAt: Double?
            let remainingSeconds: Double?
            let dialUnit: String?
            let dialSeconds: Double?
        }
        struct Labels: Decodable {
            let paused: String
            let secShort: String?
        }
        let timer: Timer
        let labels: Labels
        let dark: Bool?
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
            call.reject("json manquant")
            return
        }
        guard #available(iOS 16.2, *) else {
            // Avant iOS 16.2 il n'y a pas de Live Activity : ce n'est pas une erreur,
            // simplement rien à montrer. L'app ne doit pas s'en inquiéter.
            call.resolve()
            return
        }
        guard let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data) else {
            call.reject("état illisible")
            return
        }
        Task { await self.apply(snapshot); call.resolve() }
    }

    @objc func hide(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve()
            return
        }
        Task { await self.endAll(); call.resolve() }
    }

    @available(iOS 16.2, *)
    private func apply(_ snapshot: Snapshot) async {
        let timer = snapshot.timer
        let now = Date().timeIntervalSince1970 * 1000
        let running = timer.state == "running" && (timer.endAt ?? 0) > now
        let paused = timer.state == "paused"

        // Au repos ou une fois terminé, il n'y a plus de décompte à suivre : on referme.
        guard running || paused else {
            await endAll()
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let left = running
            ? ((timer.endAt ?? 0) - now) / 1000
            : (timer.remainingSeconds ?? timer.dialSeconds ?? 0)
        let inSeconds = timer.dialUnit == "seconds"
        let state = PomodoroActivityAttributes.ContentState(
            name: timer.name,
            colorHex: timer.color,
            endAt: running ? timer.endAt.map { Date(timeIntervalSince1970: $0 / 1000) } : nil,
            remainingSeconds: max(0, left),
            dialUnits: min(60, inSeconds ? max(0, left) : max(0, left) / 60),
            inSeconds: inSeconds,
            paused: paused,
            pausedLabel: snapshot.labels.paused,
            secShort: snapshot.labels.secShort ?? "s",
            dark: snapshot.dark ?? false
        )

        // Une activité à la fois : la même session ne doit pas s'empiler sur l'écran.
        if let activity = Activity<PomodoroActivityAttributes>.activities.first {
            await activity.update(ActivityContent(state: state, staleDate: state.endAt))
            return
        }
        _ = try? Activity.request(
            attributes: PomodoroActivityAttributes(),
            content: ActivityContent(state: state, staleDate: state.endAt)
        )
    }

    @available(iOS 16.2, *)
    private func endAll() async {
        for activity in Activity<PomodoroActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}
