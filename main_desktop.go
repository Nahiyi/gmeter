//go:build dev || production || bindings

package main

import "gmeter/desktop"

func main() {
	if err := desktop.Run(); err != nil {
		panic(err)
	}
}
