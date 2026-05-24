package desktop

import "testing"

func TestDesktopWindowUsesCustomChrome(t *testing.T) {
	app := NewApp()
	options := newAppOptions(app)

	if !options.Frameless {
		t.Fatal("expected desktop window to be frameless for custom chrome")
	}
	if options.Title != "GMeter" {
		t.Fatalf("expected title GMeter, got %q", options.Title)
	}
	if options.MinWidth < 960 || options.MinHeight < 640 {
		t.Fatalf("expected desktop minimum size to preserve workbench layout, got %dx%d", options.MinWidth, options.MinHeight)
	}
}
