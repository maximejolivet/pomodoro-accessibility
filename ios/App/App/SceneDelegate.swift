import UIKit
import Capacitor
import WebKit

/// Contrôleur de la WebView : il donne la version de l'app à la page avant qu'elle ne charge, pour
/// que l'écran de démarrage de `index.html` l'affiche comme celui d'ici.
final class AppBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        let js = "document.addEventListener('DOMContentLoaded',function(){var e=document.getElementById('boot-version');if(e)e.textContent='v\(version)';});"
        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        webView?.configuration.userContentController.addUserScript(script)
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    /// Fond de l'app, le même que celui de la page (`#f5f2ea`) : pas de noir ni de blanc au lancement.
    private let bootColor = UIColor(red: 0xF5 / 255, green: 0xF2 / 255, blue: 0xEA / 255, alpha: 1)
    private var bootOverlay: UIView?
    private var loadingObservation: NSKeyValueObservation?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let bridge = AppBridgeViewController()
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = bootColor
        window?.rootViewController = bridge
        window?.makeKeyAndVisible()

        showBootOverlay(over: bridge)

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    /// Logo posé par-dessus la WebView le temps qu'elle charge. Même taille et même place que celui
    /// de `index.html` (96 pt, centré) : quand l'overlay s'efface, la page prend le relais sans saut.
    private func showBootOverlay(over bridge: CAPBridgeViewController) {
        guard let window = window else { return }

        let overlay = UIView(frame: window.bounds)
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlay.backgroundColor = bootColor
        overlay.isUserInteractionEnabled = false

        let logo = UIImageView(image: UIImage(named: "BootLogo"))
        logo.frame = CGRect(x: 0, y: 0, width: 96, height: 96)
        logo.center = CGPoint(x: overlay.bounds.midX, y: overlay.bounds.midY)
        logo.autoresizingMask = [.flexibleTopMargin, .flexibleBottomMargin, .flexibleLeftMargin, .flexibleRightMargin]
        overlay.addSubview(logo)

        // La version, en bas : même police, même taille et même place que `.boot-version` de la page.
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        if !version.isEmpty {
            let label = UILabel()
            label.text = "v\(version)"
            label.font = .systemFont(ofSize: 12, weight: .medium)
            label.textColor = UIColor(red: 0x5B / 255, green: 0x6B / 255, blue: 0x7A / 255, alpha: 1)
            label.textAlignment = .center
            label.translatesAutoresizingMaskIntoConstraints = false
            overlay.addSubview(label)
            NSLayoutConstraint.activate([
                label.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
                label.bottomAnchor.constraint(equalTo: overlay.safeAreaLayoutGuide.bottomAnchor, constant: -24)
            ])
        }

        window.addSubview(overlay)
        bootOverlay = overlay

        // Dès que la page a fini de charger, l'overlay s'efface. Le logo de la page est déjà dessous.
        DispatchQueue.main.async { [weak self, weak bridge] in
            guard let self = self, let webView = bridge?.webView else { self?.hideBootOverlay(); return }
            self.loadingObservation = webView.observe(\.isLoading, options: [.new]) { [weak self] _, change in
                if change.newValue == false { self?.hideBootOverlay() }
            }
        }
        // Filet de sécurité : l'overlay ne reste jamais plus de 6 s, quoi qu'il arrive.
        DispatchQueue.main.asyncAfter(deadline: .now() + 6) { [weak self] in self?.hideBootOverlay() }
    }

    private func hideBootOverlay() {
        loadingObservation = nil
        guard let overlay = bootOverlay else { return }
        bootOverlay = nil
        UIView.animate(withDuration: 0.2, delay: 0.1, options: [], animations: { overlay.alpha = 0 }) { _ in
            overlay.removeFromSuperview()
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
