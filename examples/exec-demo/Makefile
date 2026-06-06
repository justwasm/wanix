all: exec-demo.wasm

exec-demo.wasm: main.go go.mod
	GOOS=js GOARCH=wasm go build -o exec-demo.wasm .
	ls -lh exec-demo.wasm

clean:
	rm -f exec-demo.wasm
