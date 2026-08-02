//go:build js && wasm

package main

import "testing"

func TestParseNetdev(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		device map[string]any
		relay  string
	}{
		{
			name:   "user relay is elevated without dropping later options",
			input:  "user,id=net0,network_relay_url=fetch,type=virtio",
			device: map[string]any{"id": "net0", "type": "virtio"},
			relay:  "fetch",
		},
		{name: "fetch", input: "fetch", relay: "fetch"},
		{name: "wisp", input: "wisp,wisps://relay.example.com", relay: "wisps://relay.example.com"},
		{name: "invalid wisp", input: "wisp"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := parseNetdev(test.input)
			if got.networkRelayURL != test.relay {
				t.Fatalf("relay = %q, want %q", got.networkRelayURL, test.relay)
			}
			if len(got.netDevice) != len(test.device) {
				t.Fatalf("device = %#v, want %#v", got.netDevice, test.device)
			}
			for key, want := range test.device {
				if got.netDevice[key] != want {
					t.Fatalf("device[%q] = %#v, want %#v", key, got.netDevice[key], want)
				}
			}
		})
	}
}

func TestParseFlagsElevatesNetworkRelayURL(t *testing.T) {
	config, err := parseFlags([]string{"-netdev", "wisp,wisps://relay.example.com"})
	if err != nil {
		t.Fatal(err)
	}
	if got, want := config["network_relay_url"], any("wisps://relay.example.com"); got != want {
		t.Fatalf("network_relay_url = %#v, want %#v", got, want)
	}
	if _, found := config["net_device"]; found {
		t.Fatal("wisp must leave net_device unset so main can apply the virtio default")
	}
}
