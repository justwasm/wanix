package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type model struct {
	count  int
	width  int
	height int
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q":
			return m, tea.Quit
		case "enter", "up", "k":
			m.count++
		case "down", "j":
			m.count--
		}
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	}
	return m, nil
}

func (m model) View() tea.View {
	w := m.width
	if w == 0 {
		w = 80
	}
	xpixel, ypixel := readPixels()
	return tea.View{
		Content: fmt.Sprintf(`
Bubbletea in wanix!

Count: %d

chars: %dx%d
pixels: %dx%d

↑/k: increment
↓/j: decrement
 q:   quit
`, m.count, m.width, m.height, xpixel, ypixel),
		AltScreen: true,
	}
}

// readPixels opens the winch file and reads the current xpixel/ypixel values.
// The winch file returns "COLS ROWS XPIXEL YPIXEL" so every read gives the
// latest terminal pixel dimensions without needing WANIX_XPIXEL env vars.
func readPixels() (int, int) {
	winchPath := os.Getenv("TERM_WINCH")
	if winchPath == "" {
		return 0, 0
	}
	f, err := os.Open(winchPath)
	if err != nil {
		return 0, 0
	}
	defer f.Close()
	buf := make([]byte, 64)
	n, err := f.Read(buf)
	if err != nil {
		return 0, 0
	}
	parts := strings.Fields(string(buf[:n]))
	if len(parts) >= 4 {
		x, _ := strconv.Atoi(parts[2])
		y, _ := strconv.Atoi(parts[3])
		return x, y
	}
	return 0, 0
}

func main() {
	os.Setenv("TERM", "xterm-256color")
	os.Setenv("COLORTERM", "truecolor")

	// initial terminal dimensions come from winch (handled by the
	// bubbletea js/wasm stub in initInput), so we pass 0,0 here.
	p := tea.NewProgram(model{},
		tea.WithInput(os.Stdin),
		tea.WithOutput(os.Stdout),
	)

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "bubbletea: %v\n", err)
		os.Exit(1)
	}
}
