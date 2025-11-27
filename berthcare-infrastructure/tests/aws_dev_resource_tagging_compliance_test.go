package tests

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

// **Feature: aws-dev-environment, Property 6: Resource Tagging Compliance**
// **Validates: Requirements 8.1, 8.2, 8.3**
func TestAWSDevResourceTaggingCompliance(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 6: Resource Tagging Compliance", func(t *testing.T) {
		expected := loadDevTagExpectations(t)

		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		providerFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, found := validateProviderTags(file, content, expected)
			providerFound = providerFound || found
			violations = append(violations, fileViolations...)
		}

		require.True(t, providerFound, "expected at least one aws provider to validate")

		if len(violations) > 0 {
			t.Fatalf("found tagging violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

type tagExpectations struct {
	project     string
	environment string
	region      string
}

func loadDevTagExpectations(t *testing.T) tagExpectations {
	t.Helper()

	tfvarsPath := filepath.Join(repoRoot, "environments", "dev", "terraform.tfvars")
	content, err := os.ReadFile(tfvarsPath)
	require.NoError(t, err, "expected dev tfvars at %s", tfvarsPath)

	config, diag := hclsyntax.ParseConfig(content, tfvarsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "failed to parse dev tfvars: %s", diag.Error())

	body, ok := config.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected dev tfvars body")

	attrs := body.Attributes

	project := stringAttrOrDefault(t, attrs, "project_name", "berthcare")
	environment := stringAttrOrDefault(t, attrs, "environment", "dev")

	return tagExpectations{
		project:     project,
		environment: environment,
		region:      expectedRegion,
	}
}

func validateProviderTags(filePath string, content []byte, expected tagExpectations) ([]string, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false
	}

	var violations []string
	providerFound := false

	for _, block := range body.Blocks {
		if block.Type != "provider" || len(block.Labels) == 0 || block.Labels[0] != "aws" {
			continue
		}

		providerFound = true
		violations = append(violations, checkProviderDefaultTags(filePath, block, expected)...)
	}

	return violations, providerFound
}

func checkProviderDefaultTags(filePath string, block *hclsyntax.Block, expected tagExpectations) []string {
	var violations []string
	hasDefaultTags := false

	ctx := &hcl.EvalContext{
		Variables: map[string]cty.Value{
			"var": cty.ObjectVal(map[string]cty.Value{
				"project_name": cty.StringVal(expected.project),
				"environment":  cty.StringVal(expected.environment),
			}),
		},
	}

	for _, child := range block.Body.Blocks {
		if child.Type != "default_tags" {
			continue
		}

		hasDefaultTags = true
		tagsAttr, ok := child.Body.Attributes["tags"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d default_tags must define tags map", filePath, child.Range().Start.Line))
			continue
		}

		cons, ok := tagsAttr.Expr.(*hclsyntax.ObjectConsExpr)
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d tags must be an object literal", filePath, tagsAttr.Range().Start.Line))
			continue
		}

		violations = append(violations, ensureTagValue(filePath, cons, "Project", expected.project, ctx)...)
		violations = append(violations, ensureTagValue(filePath, cons, "Environment", expected.environment, ctx)...)
		violations = append(violations, ensureTagValue(filePath, cons, "Region", expected.region, ctx)...)
	}

	if !hasDefaultTags {
		violations = append(violations, fmt.Sprintf("%s:%d aws provider missing default_tags block", filePath, block.Range().Start.Line))
	}

	return violations
}

func ensureTagValue(filePath string, cons *hclsyntax.ObjectConsExpr, key string, expected string, ctx *hcl.EvalContext) []string {
	for _, item := range cons.Items {
		keyVal, diag := item.KeyExpr.Value(nil)
		if diag.HasErrors() {
			return []string{fmt.Sprintf("%s:%d tag key must be a constant string (%s)", filePath, item.KeyExpr.Range().Start.Line, diag.Error())}
		}

		if keyVal.Type() != cty.String {
			return []string{fmt.Sprintf("%s:%d tag key must be a string literal", filePath, item.KeyExpr.Range().Start.Line)}
		}

		if keyVal.AsString() != key {
			continue
		}

		val, diag := item.ValueExpr.Value(ctx)
		if diag.HasErrors() {
			return []string{fmt.Sprintf("%s:%d %s tag must be a constant or resolvable string (%s)", filePath, item.ValueExpr.Range().Start.Line, key, diag.Error())}
		}

		if val.Type() != cty.String {
			return []string{fmt.Sprintf("%s:%d %s tag must be a string literal", filePath, item.ValueExpr.Range().Start.Line, key)}
		}

		if val.AsString() != expected {
			return []string{fmt.Sprintf("%s:%d %s tag set to %s (expected %s)", filePath, item.ValueExpr.Range().Start.Line, key, val.AsString(), expected)}
		}

		return nil
	}

	return []string{fmt.Sprintf("%s:%d default_tags missing %s tag", filePath, cons.Range().Start.Line, key)}
}

func stringAttrOrDefault(t *testing.T, attrs hclsyntax.Attributes, name string, fallback string) string {
	t.Helper()

	attr, ok := attrs[name]
	if !ok {
		return fallback
	}

	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() || val.Type() != cty.String {
		return fallback
	}

	return val.AsString()
}
