import SwiftUI
import AVKit

@main struct PlayerUITests {
    @MainActor static func main() throws {
        func require(_ condition: Bool, _ message: String) {
            if !condition { fputs("::error::" + message + "\n", stderr); exit(1) }
        }
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("H3Player-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let audio = root.appendingPathComponent("fixture.wav")
        let format = AVAudioFormat(standardFormatWithSampleRate: 24000, channels: 1)!
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 24000)!
        buffer.frameLength = 24000
        for i in 0..<24000 { buffer.floatChannelData![0][i] = Float(sin(Double(i) * 440 * 2 * .pi / 24000)) * 0.02 }
        func writeFixture() throws {
            let file = try AVAudioFile(forWriting: audio, settings: format.settings)
            try file.write(from: buffer)
        }
        try writeFixture()
        let player = AVPlayer(url: audio)
        let host = NSHostingView(rootView: MediaPlayer(player: player))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 500, height: 180), styleMask: [.titled], backing: .buffered, defer: false)
        window.contentView = host
        window.orderFront(nil)
        Task { @MainActor in
            do {
                try await Task.sleep(nanoseconds: 500_000_000)
                for _ in 0..<30 {
                    if player.currentItem?.status == .readyToPlay { break }
                    try await Task.sleep(nanoseconds: 100_000_000)
                }
                require(player.currentItem?.status == .readyToPlay, "Audio preview must become ready: " + String(describing: player.currentItem?.error))
                player.play()
                try await Task.sleep(nanoseconds: 400_000_000)
                require(player.currentTime().seconds > 0, "Playback must advance: " + String(describing: player.currentItem?.error) + " rate=" + String(player.rate) + " wait=" + String(describing: player.reasonForWaitingToPlay))
                player.pause()
                let replacement = AVPlayer(url: audio)
                host.rootView = MediaPlayer(player: replacement)
                try await Task.sleep(nanoseconds: 300_000_000)
                window.contentView = nil
                try await Task.sleep(nanoseconds: 100_000_000)
                require(replacement.rate == 0, "Replacement must stop on teardown")
                try FileManager.default.removeItem(at: root)
                print("PASS: native SwiftUI/AppKit audio preview mounts, plays, replaces and tears down without crash")
                app.terminate(nil)
            } catch { fatalError(error.localizedDescription) }
        }
        app.run()
    }
}
