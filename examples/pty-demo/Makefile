GOROOT = /go
GO = $(GOROOT)/bin/go
GOFLAGS = GOOS=js GOARCH=wasm GOROOT=$(GOROOT)

all: pty-demo.wasm child.wasm

pty-demo.wasm: main.go
	$(GOFLAGS) $(GO) build -o $@ .

child.wasm: child/main.go
	$(GOFLAGS) $(GO) build -o $@ ./child

clean:
	rm -f *.wasm

.PHONY: all clean
