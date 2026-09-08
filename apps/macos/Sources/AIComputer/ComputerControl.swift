import AppKit
import ApplicationServices

struct ComputerElement: Codable {
    let id: String
    let role: String
    let label: String
    let value: String
    let press: Bool
    let edit: Bool
}
@MainActor protocol ComputerBackend {
    var available: Bool { get }
    func observe() throws -> [ComputerElement]
    func perform(_ action: String, id: String, text: String) throws
    func invalidate()
}
enum ComputerFailure: LocalizedError {
    case permission, target, stale, unsupported
    var errorDescription: String? {
        switch self {
        case .permission: return L("시스템 설정에서 H3의 손쉬운 사용 권한을 허용하세요.")
        case .target: return L("컴퓨터 제어를 켜고 실행 중인 대상 앱을 선택하세요.")
        case .stale: return L("화면 정보가 만료되거나 변경되었습니다. 다시 관찰하세요.")
        case .unsupported: return L("이 화면 요소는 해당 작업을 지원하지 않습니다.")
        }
    }
}
/// A capability expires after one mutation, a new observation, stop, or 60 seconds.
/// All calls (including observation) are gated by the agent's approval broker.
@MainActor final class ComputerSession {
    let backend: ComputerBackend
    private var elements: [String: ComputerElement] = [:]
    private var observedAt = Date.distantPast
    var now: () -> Date = { Date() }
    init(backend: ComputerBackend) { self.backend = backend }
    func invalidate() { elements = [:]; observedAt = .distantPast; backend.invalidate() }
    func preview(_ action: String, id: String, text: String) throws -> String {
        guard backend.available else { throw ComputerFailure.permission }
        if action == "computer_observe" { return L("선택한 앱의 화면 요소와 텍스트를 읽어 브레인에 전달합니다.") }
        if action == "computer_focus" { return L("선택한 앱을 앞으로 가져옵니다.") }
        guard now().timeIntervalSince(observedAt) < 60, let element = elements[id] else { throw ComputerFailure.stale }
        guard (action == "computer_press" && element.press) || (action == "computer_type" && element.edit && text.utf8.count <= 4096) else { throw ComputerFailure.unsupported }
        return "\(element.role) · \(element.label)\n\(action == "computer_type" ? text : L("버튼 누르기"))"
    }
    func execute(_ action: String, id: String, text: String) throws -> String {
        _ = try preview(action, id: id, text: text)
        if action == "computer_observe" {
            invalidate()
            let rows = try backend.observe()
            elements = Dictionary(uniqueKeysWithValues: rows.map { ($0.id, $0) }); observedAt = now()
            return String(decoding: try JSONEncoder().encode(rows), as: UTF8.self)
        }
        defer { invalidate() }
        try backend.perform(action, id: id, text: text)
        return L("앱에 작업 요청을 전달했습니다. 다시 관찰하여 결과를 확인하세요.")
    }
}

/// Semantic UI automation: no global keyboard injection, shell, or screenshot capture.
@MainActor final class MacComputerBackend: ComputerBackend {
    private let application: NSRunningApplication
    private var nodes: [String: (AXUIElement, String)] = [:]
    var available: Bool { AXIsProcessTrusted() }
    init(application: NSRunningApplication) { self.application = application }
    func invalidate() { nodes = [:] }
    private func target() throws -> AXUIElement {
        guard available else { throw ComputerFailure.permission }
        guard !application.isTerminated, application.processIdentifier != ProcessInfo.processInfo.processIdentifier else { throw ComputerFailure.target }
        let root = AXUIElementCreateApplication(application.processIdentifier)
        AXUIElementSetMessagingTimeout(root, 0.2)
        return root
    }
    private func attribute(_ node: AXUIElement, _ name: String) -> CFTypeRef? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(node, name as CFString, &value) == .success else { return nil }
        return value
    }
    private func string(_ node: AXUIElement, _ name: String) -> String { attribute(node, name) as? String ?? "" }
    private func secure(_ node: AXUIElement) -> Bool {
        var current: AXUIElement? = node
        for _ in 0..<16 {
            guard let n = current else { return false }
            if string(n, kAXSubroleAttribute) == kAXSecureTextFieldSubrole { return true }
            guard let parent = attribute(n, kAXParentAttribute), CFGetTypeID(parent) == AXUIElementGetTypeID() else { return false }
            current = unsafeBitCast(parent, to: AXUIElement.self)
        }
        return true // An unbounded ancestry cannot be verified.
    }
    private func signature(_ node: AXUIElement) -> String {
        [kAXRoleAttribute, kAXTitleAttribute, kAXDescriptionAttribute, kAXValueAttribute].map { string(node, $0) }.joined(separator: "\u{0}")
    }
    private func capabilities(_ node: AXUIElement) -> (Bool, Bool) {
        var actions: CFArray?; AXUIElementCopyActionNames(node, &actions)
        var settable = DarwinBoolean(false)
        AXUIElementIsAttributeSettable(node, kAXValueAttribute as CFString, &settable)
        let role = string(node, kAXRoleAttribute)
        let enabled = (attribute(node, kAXEnabledAttribute) as? Bool) != false
        return (enabled && (actions as? [String] ?? []).contains(kAXPressAction), enabled && settable.boolValue && [kAXTextFieldRole, kAXTextAreaRole].contains(role))
    }
    func observe() throws -> [ComputerElement] {
        let root = try target(); invalidate()
        var rows: [ComputerElement] = []
        var visited: [AXUIElement] = []
        let deadline = Date().addingTimeInterval(2)
        func walk(_ node: AXUIElement, _ depth: Int) {
            guard depth <= 8, visited.count < 100, Date() < deadline, !visited.contains(where: { CFEqual($0, node) }) else { return }
            visited.append(node)
            guard !secure(node) else { return }
            let role = string(node, kAXRoleAttribute)
            let label = String((string(node, kAXTitleAttribute) + " " + string(node, kAXDescriptionAttribute)).prefix(180))
            let caps = capabilities(node)
            let id = UUID().uuidString
            nodes[id] = (node, signature(node))
            rows.append(ComputerElement(id: id, role: role, label: label, value: String(string(node, kAXValueAttribute).prefix(500)), press: caps.0, edit: caps.1))
            var children: CFArray?
            if AXUIElementCopyAttributeValues(node, kAXChildrenAttribute as CFString, 0, 100, &children) == .success {
                for child in children as? [AXUIElement] ?? [] { walk(child, depth + 1) }
            }
        }
        walk(root, 0)
        guard rows.count > 1 else { throw ComputerFailure.unsupported }
        return rows
    }
    func perform(_ action: String, id: String, text: String) throws {
        _ = try target()
        if action == "computer_focus" {
            guard application.activate(options: []) else { throw ComputerFailure.target }; return
        }
        guard let (node, original) = nodes[id], !secure(node), signature(node) == original else { throw ComputerFailure.stale }
        var pid: pid_t = 0
        guard AXUIElementGetPid(node, &pid) == .success, pid == application.processIdentifier else { throw ComputerFailure.target }
        let caps = capabilities(node)
        let status: AXError
        if action == "computer_press", caps.0 { status = AXUIElementPerformAction(node, kAXPressAction as CFString) }
        else if action == "computer_type", caps.1, text.utf8.count <= 4096 { status = AXUIElementSetAttributeValue(node, kAXValueAttribute as CFString, text as CFString) }
        else { throw ComputerFailure.unsupported }
        guard status == .success else { throw ComputerFailure.unsupported }
    }
}
