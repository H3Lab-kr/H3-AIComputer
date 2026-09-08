import SwiftUI
import AVKit

/// Use the AppKit player directly. SwiftUI VideoPlayer aborts in _AVKit_SwiftUI
/// generic metadata initialization on the reported macOS 26.6.2 environment.
struct MediaPlayer: NSViewRepresentable {
    let player: AVPlayer
    func makeNSView(context: Context) -> AVPlayerView {
        let view = AVPlayerView()
        view.controlsStyle = .inline
        view.player = player
        return view
    }
    func updateNSView(_ view: AVPlayerView, context: Context) {
        if view.player !== player { view.player?.pause(); view.player = player }
    }
    static func dismantleNSView(_ view: AVPlayerView, coordinator: ()) {
        view.player?.pause()
        view.player = nil
    }
}
