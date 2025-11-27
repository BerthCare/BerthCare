package tests

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
)

func TestVPCOutputsDefined(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, VPC outputs defined (Requirement 3.6)", func(t *testing.T) {
		outputsPath := filepath.Join(repoRoot, "modules", "vpc", "outputs.tf")

		content, err := os.ReadFile(outputsPath)
		require.NoError(t, err, "expected VPC outputs.tf to be readable")

	parsedFile, diag := hclsyntax.ParseConfig(content, outputsPath, hcl.Pos{Line: 1, Column: 1})
		require.False(t, diag.HasErrors(), "expected outputs.tf to parse: %s", diag.Error())

		body, ok := parsedFile.Body.(*hclsyntax.Body)
		require.True(t, ok, "expected outputs.tf body to be hclsyntax.Body")

		required := map[string]bool{
			"vpc_id":            false,
			"public_subnet_ids": false,
			"private_subnet_ids": false,
			"nat_gateway_ids":   false,
		}

		for _, block := range body.Blocks {
			if block.Type != "output" || len(block.Labels) == 0 {
				continue
			}
			if _, ok := required[block.Labels[0]]; ok {
				required[block.Labels[0]] = true
			}
		}

		var missing []string
		for name, present := range required {
			if !present {
				missing = append(missing, name)
			}
		}

		if len(missing) > 0 {
			t.Fatalf("missing required VPC outputs: %v", missing)
		}
	})
}
