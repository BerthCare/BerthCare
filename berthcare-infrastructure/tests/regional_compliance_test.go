package tests

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

const (
	repoRoot       = ".."
	expectedRegion = "ca-central-1"
)

func TestRegionalCompliance(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 1: Regional Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations := validateRegions(file, content)
			violations = append(violations, fileViolations...)
		}

		if len(violations) > 0 {
			t.Fatalf("found region violations (expected %s):\n%s", expectedRegion, strings.Join(violations, "\n"))
		}
	})
}

func collectTerraformFiles(root string) ([]string, error) {
	var files []string

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		if d.IsDir() {
			switch d.Name() {
			case ".git", ".terraform", "node_modules", "vendor":
				return filepath.SkipDir
			}
			return nil
		}

		if strings.HasSuffix(d.Name(), ".tf") {
			files = append(files, path)
		}

		return nil
	})

	return files, err
}

func validateRegions(filePath string, content []byte) []string {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}
	}

	var violations []string
	walkBodyForRegions(body, filePath, nil, &violations)
	return violations
}

func walkBodyForRegions(body *hclsyntax.Body, filePath string, path []string, violations *[]string) {
	for name, attr := range body.Attributes {
		if name == "region" {
			val, diag := attr.Expr.Value(nil)
			if diag.HasErrors() {
				*violations = append(*violations, fmt.Sprintf("%s:%d region must be a constant string (%s)", filePath, attr.Range().Start.Line, diag.Error()))
				continue
			}

			if val.Type() != cty.String {
				*violations = append(*violations, fmt.Sprintf("%s:%d region must be a string literal", filePath, attr.Range().Start.Line))
				continue
			}

			region := val.AsString()
			if region != expectedRegion {
				blockPath := strings.Join(path, "/")
				if blockPath == "" {
					blockPath = "<root>"
				}
				*violations = append(*violations, fmt.Sprintf("%s:%d block %s sets region to %s (expected %s)", filePath, attr.Range().Start.Line, blockPath, region, expectedRegion))
			}
		}
	}

	for _, block := range body.Blocks {
		nestedPath := append(path, block.Type)
		nestedPath = append(nestedPath, block.Labels...)
		walkBodyForRegions(block.Body, filePath, nestedPath, violations)
	}
}
