import Capacitor

/// Contrôleur principal : enregistre les plugins propres à l'app (non publiés sur npm).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
