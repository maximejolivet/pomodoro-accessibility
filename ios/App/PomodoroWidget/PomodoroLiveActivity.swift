import ActivityKit
import SwiftUI
import WidgetKit

/**
 Le décompte sur l'écran verrouillé et dans la Dynamic Island. Il reprend le cadran du
 widget — même `DialFace`, même palette : c'est la même app, vue d'un autre endroit.

 Deux horloges, comme ailleurs : le temps chiffré est un `Text(timerInterval:)` que le
 système égrène tout seul, tandis que le cadran est **figé entre deux mises à jour**. Une
 Live Activity ne se redessine pas d'elle-même, et la réveiller à la minute demanderait un
 serveur de notifications push. Le disque saute donc d'un cran à chaque fois que l'app a la
 main — au démarrage, à la pause, au changement d'étape.
 */
@available(iOS 16.2, *)
struct PomodoroLiveActivity: Widget {

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PomodoroActivityAttributes.self) { context in
            lockScreen(context.state)
                .activityBackgroundTint(palette(context.state).face)
                .activitySystemActionForegroundColor(palette(context.state).ink)
        } dynamicIsland: { context in
            let state = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    dial(state, size: 62)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    time(state, size: 34)
                        .foregroundStyle(Color(hex: state.colorHex))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(state.paused ? "\(state.name) · \(state.pausedLabel)" : state.name)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .lineLimit(1)
                }
            } compactLeading: {
                Circle()
                    .fill(Color(hex: state.colorHex))
                    .frame(width: 10, height: 10)
            } compactTrailing: {
                time(state, size: 15)
                    .foregroundStyle(Color(hex: state.colorHex))
            } minimal: {
                Circle()
                    .fill(Color(hex: state.colorHex))
                    .frame(width: 10, height: 10)
            }
        }
    }

    /// L'écran verrouillé : le cadran à gauche, le mode et le temps à droite.
    @ViewBuilder
    private func lockScreen(_ state: PomodoroActivityAttributes.ContentState) -> some View {
        let colors = palette(state)
        HStack(spacing: 14) {
            dial(state, size: 72)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(Color(hex: state.colorHex))
                        .frame(width: 9, height: 9)
                    Text(state.name)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(colors.ink)
                        .lineLimit(1)
                }
                time(state, size: 36)
                    .foregroundStyle(state.paused ? colors.muted : Color(hex: state.colorHex))
                if state.paused {
                    Text(state.pausedLabel)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(colors.muted)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
    }

    private func dial(_ state: PomodoroActivityAttributes.ContentState, size: CGFloat) -> some View {
        DialFace(
            units: state.dialUnits,
            color: Color(hex: state.colorHex),
            palette: palette(state),
            secondsLabel: state.inSeconds ? state.secShort : nil
        )
        .frame(width: size, height: size)
    }

    /// Le temps : compté par le système tant qu'il court, figé dès qu'il s'arrête.
    @ViewBuilder
    private func time(_ state: PomodoroActivityAttributes.ContentState, size: CGFloat) -> some View {
        Group {
            if let end = state.endAt, !state.paused {
                Text(timerInterval: Date()...end, countsDown: true)
            } else {
                Text(clock(state.remainingSeconds))
            }
        }
        .font(.system(size: size, weight: .bold, design: .rounded))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.6)
        .environment(\.layoutDirection, .leftToRight)
    }

    private func palette(_ state: PomodoroActivityAttributes.ContentState) -> Palette {
        state.dark ? .dark : .light
    }

    private func clock(_ seconds: Double) -> String {
        let total = Int(max(0, seconds).rounded(.up))
        return String(format: "%02d:%02d", total / 60, total % 60)
    }
}
