package desktop

import "embed"

// Assets contains the built frontend files for the Wails desktop app.
//
//go:embed all:frontend/dist
var Assets embed.FS
