package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	fmt.Println("CHILD started (PID:", os.Getpid(), ")")
	fmt.Println("Type something and press Enter. Type 'quit' to exit.")

	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "quit" {
			fmt.Println("Goodbye!")
			return
		}
		fmt.Printf("echo: %s\n", line)
	}
}
