GOROOT=/root/justwasm/go
GO=$(GOROOT)/bin/go

.PHONY: all toolchain clean

all: toolchain

toolchain:
	mkdir -p toolchain/{bin,pkg/tool/js_wasm,src,lib/wasm}
	GOOS=js GOARCH=wasm GOROOT=$(GOROOT) $(GO) build -o toolchain/bin/go.wasm cmd/go
	GOOS=js GOARCH=wasm GOROOT=$(GOROOT) $(GO) build -o toolchain/bin/gofmt.wasm cmd/gofmt
	for tool in asm compile link pack buildid cover vet; do \
		GOOS=js GOARCH=wasm GOROOT=$(GOROOT) $(GO) build -o toolchain/pkg/tool/js_wasm/$$tool cmd/$$tool; \
	done
	(cd $(GOROOT)/src && find . -maxdepth 1 -type d ! -name 'cmd' ! -name 'test' ! -name '.*' \
		-exec cp -a $(GOROOT)/src/{} $(CURDIR)/toolchain/src/ \;)
	cp $(GOROOT)/lib/wasm/wasm_exec.js toolchain/lib/wasm/
	tar czf go-toolchain.tar.gz --exclude='testdata' --exclude='*_test.go' -C toolchain .
	ls -lah go-toolchain.tar.gz

clean:
	rm -rf toolchain go-toolchain.tar.gz

.PHONY: serve
serve:
	go run ../../cmd/wanix serve .
