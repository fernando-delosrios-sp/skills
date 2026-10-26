package driver

import (
	"testing"
)

func TestGetDriver(t *testing.T) {
	for _, p := range []string{"cursor", "antigravity", "opencode"} {
		d, err := GetDriver(p)
		if err != nil {
			t.Fatalf("expected driver for %s, got error: %v", p, err)
		}
		if d.Name() != p {
			t.Fatalf("expected name %s, got %s", p, d.Name())
		}
	}

	_, err := GetDriver("unknown")
	if err == nil {
		t.Fatal("expected error for unknown driver")
	}
}
