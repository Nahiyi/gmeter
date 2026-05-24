package desktop

import (
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

// Run starts the GMeter desktop application.
func Run() error {
	app := NewApp()

	return wails.Run(newAppOptions(app))
}

func newAppOptions(app *App) *options.App {
	return &options.App{
		Title:     "GMeter",
		Width:     1280,
		Height:    820,
		MinWidth:  960,
		MinHeight: 640,
		Frameless: true,
		Assets:    Assets,
		Bind: []interface{}{
			app,
		},
		OnStartup: app.Startup,
	}
}
