//go:build !dev && !production && !bindings

package main

import (
	"gmeter/cmd"
)

func main() {
	cmd.Execute()
}
