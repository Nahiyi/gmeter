package main

import (
	"gmeter/desktop"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

func main() {
	app := desktop.NewApp()

	err := wails.Run(&options.App{
		Title:     "GMeter",
		Width:     1280,
		Height:    820,
		MinWidth:  960,
		MinHeight: 640,
		Assets:    desktop.Assets,
		Bind: []interface{}{
			app,
		},
		OnStartup: app.Startup,
	})
	if err != nil {
		panic(err)
	}
}
