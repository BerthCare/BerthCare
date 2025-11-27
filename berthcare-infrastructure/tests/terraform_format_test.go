package tests

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestTerraformFormatCompliance(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 7: Terraform Format Compliance", func(t *testing.T) {
		workingDir := filepath.Clean(repoRoot)

		cmd := exec.Command("terraform", "fmt", "-check", "-recursive")
		cmd.Dir = workingDir
		cmd.Env = append(os.Environ(), "TF_IN_AUTOMATION=1")

		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("terraform fmt -check failed: %v\n%s", err, string(out))
		}
	})
}
