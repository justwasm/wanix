package main

import (
	"fmt"
	"os"
	"strconv"

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
	xpixel, _ := strconv.Atoi(os.Getenv("WANIX_XPIXEL"))
	ypixel, _ := strconv.Atoi(os.Getenv("WANIX_YPIXEL"))
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

func main() {
	os.Setenv("TERM", "xterm-256color")
	os.Setenv("COLORTERM", "truecolor")

	// read initial terminal dimensions from env (set by task.js from term element)
	initCols, _ := strconv.Atoi(os.Getenv("WANIX_COLS"))
	initRows, _ := strconv.Atoi(os.Getenv("WANIX_ROWS"))

	p := tea.NewProgram(model{width: initCols, height: initRows},
		tea.WithInput(os.Stdin),
		tea.WithOutput(os.Stdout),
	)

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "bubbletea: %v\n", err)
		os.Exit(1)
	}
}
