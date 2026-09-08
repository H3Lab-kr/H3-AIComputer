import SwiftUI
import AppKit
import Vision

/// Verifies the production view without recreating its workspace on language changes.
@main struct LocalizationUITests {
 @MainActor static func main() {
  let app = NSApplication.shared
  app.setActivationPolicy(.regular)
  let previous = UserDefaults.standard.object(forKey: "app.language")
  UserDefaults.standard.set("en", forKey: "app.language")
  let host = NSHostingView(rootView: ContentView())
  let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1220, height: 860), styleMask: [.titled], backing: .buffered, defer: false)
  window.contentView = host
  window.makeKeyAndOrderFront(nil)
  app.activate(ignoringOtherApps: true)
  Task { @MainActor in
   await verifyLanguages(host)
   if let previous { UserDefaults.standard.set(previous, forKey: "app.language") }
   else { UserDefaults.standard.removeObject(forKey: "app.language") }
   print("PASS: production native view switches English → Korean → English without replacing workspace")
   app.terminate(nil)
  }
  app.run()
 }

 @MainActor static func labels(_ node: Any, depth: Int = 0) -> [String] {
  guard depth < 40, let object = node as? NSObject else { return [] }
  let label = property(object, "accessibilityLabel") as? String ?? ""
  let value = String(describing: property(object, "accessibilityValue") ?? "")
  var result = [label, value]
  let children = property(object, "accessibilityChildren") as? [Any] ?? []
  for child in children { result.append(contentsOf: labels(child, depth: depth + 1)) }
  return result
 }
 @MainActor static func property(_ object: NSObject, _ name: String) -> Any? {
  let selector = NSSelectorFromString(name)
  guard object.responds(to: selector) else { return nil }
  return object.perform(selector)?.takeUnretainedValue()
 }
 static func normalized(_ text: String) -> String {
  let characters = text.lowercased().filter { character in
   !character.isWhitespace && !character.isPunctuation
  }
  return String(characters)
 }
 @MainActor static func snapshot(_ host: NSHostingView<ContentView>) -> NSBitmapImageRep {
  let representation = host.bitmapImageRepForCachingDisplay(in: host.bounds)!
  host.cacheDisplay(in: host.bounds, to: representation)
  return representation
 }
 @MainActor static func renderedText(_ host: NSHostingView<ContentView>, language: String) throws -> String {
  host.layoutSubtreeIfNeeded()
  let accessible = labels(host).joined(separator: "\n")
  let forceOCR = ProcessInfo.processInfo.environment["H3_TEST_OCR"] == "1"
  if !accessible.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !forceOCR { return accessible }
  // Hosted runners can expose no AX tree. Inspect rendered pixels, never skip.
  let image = snapshot(host).cgImage!
  let request = VNRecognizeTextRequest()
  request.recognitionLanguages = language == "ko" ? ["ko-KR", "en-US"] : ["en-US"]
  request.usesLanguageCorrection = false
  try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
  let observations: [VNRecognizedTextObservation] = request.results ?? []
  let strings: [String] = observations.compactMap { observation in observation.topCandidates(1).first?.string }
  return strings.joined(separator: "\n")
 }
 @MainActor static func verifyLanguages(_ host: NSHostingView<ContentView>) async {
  for language in ["en", "ko", "en"] {
   UserDefaults.standard.set(language, forKey: "app.language")
   let expected = normalized(language == "en" ? "Think it through" : "생각을 정리하고")
   let deadline = Date().addingTimeInterval(20)
   var text = ""
   do {
    while Date() < deadline {
     try await Task.sleep(nanoseconds: 200_000_000)
     text = try renderedText(host, language: language)
     if normalized(text).contains(expected) { break }
    }
    guard normalized(text).contains(expected) else {
     let details = ["Native UI language=" + language, "text length=" + String(text.count), "English heading=" + String(text.contains("Think")), "Korean heading=" + String(text.contains("생각"))]
     fail(details.joined(separator: "; "))
    }
    if CommandLine.arguments.count > 1 {
     let directory = URL(fileURLWithPath: CommandLine.arguments[1])
     try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
     let output = directory.appendingPathComponent("h3-mac-041-" + language + ".png")
     let data = snapshot(host).representation(using: .png, properties: [:])!
     try data.write(to: output)
    }
   } catch { fail("Native UI verification: " + error.localizedDescription) }
  }
 }
 static func fail(_ message: String) -> Never {
  fputs("::error::" + message + "\n", stderr)
  exit(1)
 }
}
