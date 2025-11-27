package tests

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestTerraformValidation(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 6: Terraform Validation Success", func(t *testing.T) {
		workingDir := filepath.Clean(repoRoot)

		_ = os.RemoveAll(filepath.Join(workingDir, ".terraform"))
		_ = os.Remove(filepath.Join(workingDir, ".terraform.lock.hcl"))

		initCmd := exec.Command("terraform", "init", "-backend=false", "-input=false")
		initCmd.Dir = workingDir
		initCmd.Env = append(os.Environ(), "TF_IN_AUTOMATION=1")
		if out, err := initCmd.CombinedOutput(); err != nil {
			t.Fatalf("terraform init failed: %v\n%s", err, string(out))
		}
		defer os.RemoveAll(filepath.Join(workingDir, ".terraform"))

		validateCmd := exec.Command("terraform", "validate")
		validateCmd.Dir = workingDir
		validateCmd.Env = append(os.Environ(), "TF_IN_AUTOMATION=1")
		if out, err := validateCmd.CombinedOutput(); err != nil {
			t.Fatalf("terraform validate failed: %v\n%s", err, string(out))
		}
	})
}
