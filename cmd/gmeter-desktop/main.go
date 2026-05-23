package main

import (
	"gmeter/desktop"
)

func main() {
	if err := desktop.Run(); err != nil {
		panic(err)
	}
}
