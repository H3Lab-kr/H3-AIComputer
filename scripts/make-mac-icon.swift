import AppKit
let destination = CommandLine.arguments[1]
let size = 1024
let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()
let rect = NSRect(x: 32, y: 32, width: 960, height: 960)
let shape = NSBezierPath(roundedRect: rect, xRadius: 214, yRadius: 214)
NSGradient(starting: NSColor(red: 0.07, green: 0.16, blue: 0.31, alpha: 1), ending: NSColor(red: 0.02, green: 0.04, blue: 0.09, alpha: 1))!.draw(in: shape, angle: -65)
NSColor(red: 0.36, green: 0.55, blue: 0.82, alpha: 0.6).setStroke(); shape.lineWidth = 5; shape.stroke()
let title: NSString = "H3"
let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 405, weight: .black), .foregroundColor: NSColor(red: 0.89, green: 0.76, blue: 0.49, alpha: 1), .kern: -18]
let measured = title.size(withAttributes: attrs)
title.draw(at: NSPoint(x: (1024-measured.width)/2, y: 338), withAttributes: attrs)
let subtitle: NSString = "AI COMPUTER"
let sub: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 40, weight: .medium), .foregroundColor: NSColor(red: 0.75, green: 0.82, blue: 0.94, alpha: 1), .kern: 9]
subtitle.draw(at: NSPoint(x: (1024-subtitle.size(withAttributes: sub).width)/2, y: 282), withAttributes: sub)
image.unlockFocus()
let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: destination))
