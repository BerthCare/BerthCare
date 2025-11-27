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

// **Feature: aws-staging-environment, Property 6: DNS Configuration**
// **Validates: Requirements 5.1, 5.2, 5.4**
func TestAWSStagingDNSConfiguration(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 6: DNS Configuration", func(t *testing.T) {
		expected := loadStagingDNSExpectations(t)

		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		aliasFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, found := validatePublicAliasRecords(file, content, expected)
			violations = append(violations, fileViolations...)
			aliasFound = aliasFound || found
		}

		require.True(t, aliasFound, "expected a public ALB alias Route 53 record for the staging domain")

		if len(violations) > 0 {
			t.Fatalf("found DNS configuration violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

type dnsExpectations struct {
	domain string
	zoneID string
}

func loadStagingDNSExpectations(t *testing.T) dnsExpectations {
	t.Helper()

	tfvarsPath := filepath.Join(repoRoot, "environments", "staging", "terraform.tfvars")
	content, err := os.ReadFile(tfvarsPath)
	require.NoError(t, err, "expected staging tfvars at %s", tfvarsPath)

	config, diag := hclsyntax.ParseConfig(content, tfvarsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "failed to parse staging tfvars: %s", diag.Error())

	body, ok := config.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected staging tfvars body")

	attrs := body.Attributes

	domain := requireStringAttr(t, attrs, "domain_name")
	zoneID := requireStringAttr(t, attrs, "route53_zone_id")

	return dnsExpectations{
		domain: domain,
		zoneID: zoneID,
	}
}

func validatePublicAliasRecords(filePath string, content []byte, expected dnsExpectations) ([]string, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false
	}

	var (
		violations []string
		found      bool
	)

	ctx := &hcl.EvalContext{
		Variables: map[string]cty.Value{
			"var": cty.ObjectVal(map[string]cty.Value{
				"domain_name":     cty.StringVal(expected.domain),
				"route53_zone_id": cty.StringVal(expected.zoneID),
			}),
		},
	}

	for _, block := range body.Blocks {
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_route53_record" {
			continue
		}

		aliases := aliasBlocks(block.Body.Blocks)
		if len(aliases) == 0 {
			continue
		}

		if !recordTargetsDomain(block, expected, ctx) {
			continue
		}

		found = true
		violations = append(violations, checkAliasRecord(filePath, block, aliases, expected, ctx)...)
	}

	return violations, found
}

func aliasBlocks(blocks hclsyntax.Blocks) []*hclsyntax.Block {
	var aliases []*hclsyntax.Block
	for _, b := range blocks {
		if b.Type == "alias" {
			aliases = append(aliases, b)
		}
	}
	return aliases
}

func recordTargetsDomain(block *hclsyntax.Block, expected dnsExpectations, ctx *hcl.EvalContext) bool {
	nameAttr, hasName := block.Body.Attributes["name"]
	zoneAttr, hasZone := block.Body.Attributes["zone_id"]

	matchesName := false
	if hasName {
		if val, diag := nameAttr.Expr.Value(ctx); !diag.HasErrors() {
			matchesName = val.Type() == cty.String && val.AsString() == expected.domain
		} else if isVarReference(nameAttr.Expr, "domain_name") {
			matchesName = true
		}
	}

	matchesZone := false
	if hasZone {
		if val, diag := zoneAttr.Expr.Value(ctx); !diag.HasErrors() {
			matchesZone = val.Type() == cty.String && val.AsString() == expected.zoneID
		} else if isVarReference(zoneAttr.Expr, "route53_zone_id") {
			matchesZone = true
		}
	}

	return matchesName || matchesZone
}

func checkAliasRecord(filePath string, block *hclsyntax.Block, aliases []*hclsyntax.Block, expected dnsExpectations, ctx *hcl.EvalContext) []string {
	var violations []string

	typeAttr, ok := block.Body.Attributes["type"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d route53 record missing type", filePath, block.Range().Start.Line))
	} else {
		val, diag := typeAttr.Expr.Value(nil)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d type must be a constant string (%s)", filePath, typeAttr.Range().Start.Line, diag.Error()))
		} else if val.Type() != cty.String || strings.ToUpper(val.AsString()) != "A" {
			violations = append(violations, fmt.Sprintf("%s:%d type must be \"A\"", filePath, typeAttr.Range().Start.Line))
		}
	}

	nameAttr, ok := block.Body.Attributes["name"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d route53 record missing name", filePath, block.Range().Start.Line))
	} else {
		val, diag := nameAttr.Expr.Value(ctx)
		if diag.HasErrors() {
			if !isVarReference(nameAttr.Expr, "domain_name") {
				violations = append(violations, fmt.Sprintf("%s:%d name must resolve to domain_name (%s)", filePath, nameAttr.Range().Start.Line, diag.Error()))
			}
		} else if val.Type() != cty.String || val.AsString() != expected.domain {
			violations = append(violations, fmt.Sprintf("%s:%d name set to %s (expected %s)", filePath, nameAttr.Range().Start.Line, val.AsString(), expected.domain))
		}
	}

	zoneAttr, ok := block.Body.Attributes["zone_id"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d route53 record missing zone_id", filePath, block.Range().Start.Line))
	} else {
		val, diag := zoneAttr.Expr.Value(ctx)
		if diag.HasErrors() {
			if !isVarReference(zoneAttr.Expr, "route53_zone_id") {
				violations = append(violations, fmt.Sprintf("%s:%d zone_id must resolve to route53_zone_id (%s)", filePath, zoneAttr.Range().Start.Line, diag.Error()))
			}
		} else if val.Type() != cty.String || val.AsString() != expected.zoneID {
			violations = append(violations, fmt.Sprintf("%s:%d zone_id set to %s (expected %s)", filePath, zoneAttr.Range().Start.Line, val.AsString(), expected.zoneID))
		}
	}

	for _, alias := range aliases {
		violations = append(violations, checkAliasBlock(filePath, alias)...)
	}

	return violations
}

func checkAliasBlock(filePath string, alias *hclsyntax.Block) []string {
	var violations []string

	nameAttr, ok := alias.Body.Attributes["name"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d alias block missing name", filePath, alias.Range().Start.Line))
	} else if !referencesModuleOutput(nameAttr.Expr, "ecs", "alb_dns_name") {
		violations = append(violations, fmt.Sprintf("%s:%d alias name should reference module.ecs.alb_dns_name", filePath, nameAttr.Range().Start.Line))
	}

	zoneAttr, ok := alias.Body.Attributes["zone_id"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d alias block missing zone_id", filePath, alias.Range().Start.Line))
	} else if !referencesModuleOutput(zoneAttr.Expr, "ecs", "alb_zone_id") {
		violations = append(violations, fmt.Sprintf("%s:%d alias zone_id should reference module.ecs.alb_zone_id", filePath, zoneAttr.Range().Start.Line))
	}

	evalAttr, ok := alias.Body.Attributes["evaluate_target_health"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d alias block missing evaluate_target_health", filePath, alias.Range().Start.Line))
	} else {
		val, diag := evalAttr.Expr.Value(nil)
		if diag.HasErrors() || val.Type() != cty.Bool || !val.True() {
			violations = append(violations, fmt.Sprintf("%s:%d evaluate_target_health must be true", filePath, evalAttr.Range().Start.Line))
		}
	}

	return violations
}

func referencesModuleOutput(expr hclsyntax.Expression, moduleName string, output string) bool {
	for _, trav := range expr.Variables() {
		if len(trav) < 3 {
			continue
		}

		root, ok := trav[0].(hcl.TraverseRoot)
		if !ok || root.Name != "module" {
			continue
		}

		mod, ok := trav[1].(hcl.TraverseAttr)
		if !ok || mod.Name != moduleName {
			continue
		}

		attr, ok := trav[2].(hcl.TraverseAttr)
		if !ok || attr.Name != output {
			continue
		}

		return true
	}

	return false
}
