package api

import (
	"io"
	"testing"
)

func BenchmarkPipeWrite(b *testing.B) {
	p := newPipe()
	p.addWriter()
	data := make([]byte, 4096)
	for i := range data {
		data[i] = byte(i)
	}
	buf := make([]byte, 4096)
	go func() {
		for {
			if _, err := p.Read(buf); err != nil {
				return
			}
		}
	}()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		p.Write(data)
	}
	p.removeWriter()
}

func BenchmarkPipeRead(b *testing.B) {
	p := newPipe()
	p.addWriter()
	data := make([]byte, 4096)
	for i := range data {
		data[i] = byte(i)
	}
	buf := make([]byte, 4096)
	// Fill buffer
	p.Write(data)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		p.Read(buf)
		p.Write(data)
	}
	p.removeWriter()
}

func BenchmarkPipeThroughput(b *testing.B) {
	p := newPipe()
	p.addWriter()

	const block = 64 << 10 // 64KB
	data := make([]byte, block)
	for i := range data {
		data[i] = byte(i)
	}

	b.SetBytes(block)
	b.ResetTimer()

	done := make(chan struct{}, 1)
	go func() {
		buf := make([]byte, block)
		for i := 0; i < b.N; i++ {
			total := 0
			for total < block {
				n, err := p.Read(buf[total:])
				total += n
				if err == io.EOF {
					break
				}
			}
		}
		close(done)
	}()

	for i := 0; i < b.N; i++ {
		p.Write(data)
	}
	<-done

	p.removeWriter()
}
