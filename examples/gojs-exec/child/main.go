package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	fmt.Println("CHILD started")
	fmt.Println("Args:", os.Args)
	fmt.Println("PID:", os.Getpid())
	fmt.Println("PPID:", os.Getppid())

	wd, _ := os.Getwd()
	fmt.Println("CWD:", wd)

	// Print specific env vars for demo purposes
	for _, key := range []string{"DEMO_VAR", "PATH", "USER"} {
		if v, ok := os.LookupEnv(key); ok {
			fmt.Printf("ENV[%s]=%s\n", key, v)
		}
	}

	// If first arg is "exit:N", exit with that code
	if len(os.Args) > 1 && strings.HasPrefix(os.Args[1], "exit:") {
		code := 0
		fmt.Sscanf(os.Args[1], "exit:%d", &code)
		fmt.Printf("Exiting with code %d\n", code)
		os.Exit(code)
	}

	fmt.Println("CHILD done")
}
