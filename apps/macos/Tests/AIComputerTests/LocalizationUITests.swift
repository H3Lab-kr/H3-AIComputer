import SwiftUI
import AppKit

/// Renders the production ContentView, switches language without replacing it,
/// and optionally captures the actual native view for bilingual documentation.
@main struct LocalizationUITests {
 @MainActor static func main() {
  let app=NSApplication.shared
  app.setActivationPolicy(.accessory)
  let old=UserDefaults.standard.object(forKey:"app.language")
  UserDefaults.standard.set("en",forKey:"app.language")
  let host=NSHostingView(rootView:ContentView())
  let window=NSWindow(contentRect:NSRect(x:0,y:0,width:1220,height:860),styleMask:[.titled],backing:.buffered,defer:false)
  window.contentView=host;window.orderFront(nil)
  func labels(_ node: Any, depth: Int = 0) -> [String] {
   guard depth<40,let accessible=node as? NSObject else {return []}
   func get(_ name: String) -> Any? {
    let selector=NSSelectorFromString(name)
    return accessible.responds(to:selector) ? accessible.perform(selector)?.takeUnretainedValue() : nil
   }
   var result=[get("accessibilityLabel") as? String ?? "", String(describing:get("accessibilityValue") ?? "")]
   for child in get("accessibilityChildren") as? [Any] ?? [] { result += labels(child,depth:depth+1) }
   return result
  }
  Task { @MainActor in
   for language in ["en","ko","en"] {
    UserDefaults.standard.set(language,forKey:"app.language")
    try? await Task.sleep(nanoseconds:700_000_000)
    host.layoutSubtreeIfNeeded()
    let all=labels(host).joined(separator:"\n")
    let expected=language=="en" ? "Let AI handle a task" : "AI에게 작업 맡기기"
    precondition(all.contains(expected),"Visible UI failed to switch to "+language)
    if CommandLine.arguments.count>1 {
     let directory=URL(fileURLWithPath:CommandLine.arguments[1]);try! FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)
     let rep=host.bitmapImageRepForCachingDisplay(in:host.bounds)!
     host.cacheDisplay(in:host.bounds,to:rep)
     try! rep.representation(using:.png,properties:[:])!.write(to:directory.appendingPathComponent("h3-mac-041-"+language+".png"))
    }
   }
   if let old {UserDefaults.standard.set(old,forKey:"app.language")}else{UserDefaults.standard.removeObject(forKey:"app.language")}
   print("PASS: production native view switches English → Korean → English without replacing workspace")
   app.terminate(nil)
  }
  app.run()
 }
}
