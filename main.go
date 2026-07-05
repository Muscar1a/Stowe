package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "stowe",
		Width:     1024,
		Height:    768,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 9, G: 11, B: 16, A: 1},
		Windows: &windows.Options{
			// Match the app's dark UI (#0c0e14 sidebar) regardless of the
			// system light/dark setting.
			Theme: windows.Dark,
			CustomTheme: &windows.ThemeSettings{
				DarkModeTitleBar:          windows.RGB(12, 14, 20),
				DarkModeTitleBarInactive:  windows.RGB(12, 14, 20),
				DarkModeTitleText:         windows.RGB(235, 235, 235),
				DarkModeTitleTextInactive: windows.RGB(128, 128, 128),
				DarkModeBorder:            windows.RGB(12, 14, 20),
				DarkModeBorderInactive:    windows.RGB(12, 14, 20),
			},
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
