import AppKit
final class FixtureDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    let field = NSTextField(string: "initial")
    @objc func submit() {
        try? field.stringValue.write(toFile: CommandLine.arguments[1], atomically: true, encoding: .utf8)
    }
    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 80, y: 80, width: 460, height: 240), styleMask: [.titled], backing: .buffered, defer: false)
        window.title = "H3 Computer Control Test"
        field.frame = NSRect(x: 30, y: 160, width: 360, height: 28); field.setAccessibilityLabel("Fixture text")
        let secure = NSSecureTextField(frame: NSRect(x: 30, y: 110, width: 360, height: 28)); secure.stringValue = "H3-SECRET-FIXTURE"; secure.setAccessibilityLabel("Protected fixture")
        let button = NSButton(title: "Save fixture", target: self, action: #selector(submit)); button.frame = NSRect(x: 30, y: 40, width: 180, height: 35)
        window.contentView?.addSubview(field); window.contentView?.addSubview(secure); window.contentView?.addSubview(button)
        window.makeKeyAndOrderFront(nil)
    }
}
@main struct FixtureApp {
    static func main() { let app = NSApplication.shared; let delegate = FixtureDelegate(); app.delegate = delegate; app.setActivationPolicy(.regular); app.run() }
}
