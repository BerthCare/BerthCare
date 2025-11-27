package tests

import (
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

func TestPlanRegionConstraint(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 8: Plan Region Constraint", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		providerFound := false
		backendChecked := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, found, backend := validateRegionsInProvidersAndBackend(file, content)
			violations = append(violations, fileViolations...)
			providerFound = providerFound || found
			backendChecked = backendChecked || backend
		}

		require.True(t, providerFound, "expected at least one aws provider block")
		require.True(t, backendChecked, "expected backend configuration to be checked")

		if len(violations) > 0 {
			t.Fatalf("found plan region violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateRegionsInProvidersAndBackend(filePath string, content []byte) ([]string, bool, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false, false
	}

	var violations []string
	providerFound := false
	backendChecked := false

	for _, block := range body.Blocks {
		if block.Type == "provider" && len(block.Labels) > 0 && block.Labels[0] == "aws" {
			providerFound = true
			violations = append(violations, ensureRegionAttribute(filePath, block)...)
		}

		if block.Type == "terraform" {
			for _, nested := range block.Body.Blocks {
				if nested.Type != "backend" || len(nested.Labels) == 0 || nested.Labels[0] != "s3" {
					continue
				}
				backendChecked = true
				attr, ok := nested.Body.Attributes["region"]
				if !ok {
					violations = append(violations, fmt.Sprintf("%s:%d backend \"s3\" missing region", filePath, nested.Range().Start.Line))
					continue
				}
				val, diag := attr.Expr.Value(nil)
				if diag.HasErrors() || val.Type() != cty.String || val.AsString() != expectedRegion {
					violations = append(violations, fmt.Sprintf("%s:%d backend region must be %s", filePath, attr.Range().Start.Line, expectedRegion))
				}
			}
		}
	}

	return violations, providerFound, backendChecked
}

func ensureRegionAttribute(filePath string, block *hclsyntax.Block) []string {
	attr, ok := block.Body.Attributes["region"]
	if !ok {
		return []string{fmt.Sprintf("%s:%d aws provider missing region", filePath, block.Range().Start.Line)}
	}

	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s:%d region must be a constant string (%s)", filePath, attr.Range().Start.Line, diag.Error())}
	}

	if val.Type() != cty.String {
		return []string{fmt.Sprintf("%s:%d region must be a string literal", filePath, attr.Range().Start.Line)}
	}

	if val.AsString() != expectedRegion {
		return []string{fmt.Sprintf("%s:%d region set to %s (expected %s)", filePath, attr.Range().Start.Line, val.AsString(), expectedRegion)}
	}

	return nil
}
