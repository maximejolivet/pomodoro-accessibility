import Capacitor
import WidgetKit

/// Transmet l'état du minuteur au widget : JSON écrit dans l'App Group partagé, puis rechargement des widgets.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.maximejolivet.pomodorotdah"
    static let stateKey = "widgetState"

    @objc func update(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json manquant")
            return
        }
        guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
            call.reject("App Group \(Self.appGroup) indisponible")
            return
        }
        defaults.set(json, forKey: Self.stateKey)
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
