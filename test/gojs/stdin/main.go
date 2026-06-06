package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	fmt.Println("stdin reader ready. type something and press enter:")
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "exit" || line == "quit" {
			fmt.Println("bye!")
			return
		}
		fmt.Printf("got: %s (%d bytes)\n", line, len(line))
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
