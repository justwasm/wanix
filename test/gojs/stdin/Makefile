build: stdin.wasm
.PHONY: build

stdin.wasm: main.go
	GOOS=js GOARCH=wasm go build -o stdin.wasm .

clean:
	rm -f stdin.wasm
.PHONY: clean
