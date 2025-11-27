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

func TestResourceTaggingCompliance(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 2: Resource Tagging Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		providerFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, found := validateProviderDefaultTags(file, content)
			providerFound = providerFound || found
			violations = append(violations, fileViolations...)
		}

		require.True(t, providerFound, "expected at least one aws provider to validate")

		if len(violations) > 0 {
			t.Fatalf("found tagging violations: \n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateProviderDefaultTags(filePath string, content []byte) ([]string, bool) {
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
		violations = append(violations, checkDefaultTags(filePath, block)...)
	}

	return violations, providerFound
}

func checkDefaultTags(filePath string, block *hclsyntax.Block) []string {
	var violations []string
	hasDefaultTags := false

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

		violations = append(violations, ensureRegionTag(filePath, tagsAttr)...)
	}

	if !hasDefaultTags {
		violations = append(violations, fmt.Sprintf("%s:%d aws provider missing default_tags block", filePath, block.Range().Start.Line))
	}

	return violations
}

func ensureRegionTag(filePath string, tagsAttr *hclsyntax.Attribute) []string {
	cons, ok := tagsAttr.Expr.(*hclsyntax.ObjectConsExpr)
	if !ok {
		return []string{fmt.Sprintf("%s:%d tags must be an object literal to validate region tag", filePath, tagsAttr.Range().Start.Line)}
	}

	var violations []string
	foundRegion := false

	for _, item := range cons.Items {
		keyVal, diag := item.KeyExpr.Value(nil)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d tag key must be a constant string (%s)", filePath, item.KeyExpr.Range().Start.Line, diag.Error()))
			continue
		}

		if keyVal.Type() != cty.String {
			violations = append(violations, fmt.Sprintf("%s:%d tag key must be a string literal", filePath, item.KeyExpr.Range().Start.Line))
			continue
		}

		key := keyVal.AsString()
		if key != "Region" {
			continue
		}

		foundRegion = true
		value, diag := item.ValueExpr.Value(nil)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d Region tag must be a constant string (%s)", filePath, item.ValueExpr.Range().Start.Line, diag.Error()))
			continue
		}

		if value.Type() != cty.String {
			violations = append(violations, fmt.Sprintf("%s:%d Region tag must be a string literal", filePath, item.ValueExpr.Range().Start.Line))
			continue
		}

		if value.AsString() != expectedRegion {
			violations = append(violations, fmt.Sprintf("%s:%d Region tag set to %s (expected %s)", filePath, item.ValueExpr.Range().Start.Line, value.AsString(), expectedRegion))
		}
	}

	if !foundRegion {
		violations = append(violations, fmt.Sprintf("%s:%d default_tags is missing Region tag", filePath, tagsAttr.Range().Start.Line))
	}

	return violations
}
