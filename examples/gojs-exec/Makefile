GOROOT = /root/justwasm/go
GO = $(GOROOT)/bin/go
GOFLAGS = GOOS=js GOARCH=wasm GOROOT=$(GOROOT)

all: child.wasm parent.wasm

child.wasm: child/main.go
	$(GOFLAGS) $(GO) build -o $@ ./child

parent.wasm: parent/main.go
	$(GOFLAGS) $(GO) build -o $@ ./parent

clean:
	rm -f *.wasm

.PHONY: all clean
