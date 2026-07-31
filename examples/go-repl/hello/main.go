package main

import "fmt"

func main() {
	fmt.Println("Hello from Go WASM in Wanix!")
	fmt.Println("PID:", fmt.Sprintf("%d", 0)) // os.Getpid() would need syscall
}
