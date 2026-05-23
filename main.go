package main

import (
	"fmt"
	"gmeter/cmd"
	"gmeter/desktop"
	"os"
)

func main() {
	if len(os.Args) == 1 {
		if err := desktop.Run(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		return
	}
	cmd.Execute()
}
