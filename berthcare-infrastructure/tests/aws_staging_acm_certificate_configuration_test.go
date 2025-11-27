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

// **Feature: aws-staging-environment, Property 7: ACM Certificate Configuration**
// **Validates: Requirements 6.1, 6.2**
func TestAWSStagingACMCertificateConfiguration(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 7: ACM Certificate Configuration", func(t *testing.T) {
		expected := loadStagingACMExpectations(t)

		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		certFound := false
		validationRecordFound := false
		certValidationFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, foundCert, foundRecord, foundValidation := validateACMResources(file, content, expected)
			violations = append(violations, fileViolations...)
			certFound = certFound || foundCert
			validationRecordFound = validationRecordFound || foundRecord
			certValidationFound = certValidationFound || foundValidation
		}

		require.True(t, certFound, "expected an aws_acm_certificate resource")
		require.True(t, validationRecordFound, "expected Route 53 validation records for the certificate")
		require.True(t, certValidationFound, "expected aws_acm_certificate_validation resource")

		if len(violations) > 0 {
			t.Fatalf("found ACM configuration violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

type acmExpectations struct {
	domainName string
	zoneID     string
}

func loadStagingACMExpectations(t *testing.T) acmExpectations {
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

	return acmExpectations{
		domainName: domain,
		zoneID:     zoneID,
	}
}

func validateACMResources(filePath string, content []byte, expected acmExpectations) ([]string, bool, bool, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false, false, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false, false, false
	}

	var (
		violations            []string
		certFound             bool
		validationRecordFound bool
		certValidationFound   bool
	)

	ctx := &hcl.EvalContext{
		Variables: map[string]cty.Value{
			"var": cty.ObjectVal(map[string]cty.Value{
				"domain_name":     cty.StringVal(expected.domainName),
				"route53_zone_id": cty.StringVal(expected.zoneID),
			}),
		},
	}

	for _, block := range body.Blocks {
		if block.Type != "resource" || len(block.Labels) < 2 {
			continue
		}

		switch block.Labels[0] {
		case "aws_acm_certificate":
			certFound = true
			violations = append(violations, checkACMCertificate(filePath, block, expected, ctx)...)
		case "aws_route53_record":
			if block.Labels[1] == "certificate_validation" {
				validationRecordFound = true
				violations = append(violations, checkCertificateValidationRecord(filePath, block, expected, ctx)...)
			}
		case "aws_acm_certificate_validation":
			certValidationFound = true
			violations = append(violations, checkCertificateValidationResource(filePath, block)...)
		}
	}

	return violations, certFound, validationRecordFound, certValidationFound
}

func checkACMCertificate(filePath string, block *hclsyntax.Block, expected acmExpectations, ctx *hcl.EvalContext) []string {
	var violations []string

	domainAttr, ok := block.Body.Attributes["domain_name"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d aws_acm_certificate missing domain_name", filePath, block.Range().Start.Line))
	} else {
		val, diag := domainAttr.Expr.Value(ctx)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d domain_name must be a constant or resolvable string (%s)", filePath, domainAttr.Range().Start.Line, diag.Error()))
		} else if val.Type() != cty.String {
			violations = append(violations, fmt.Sprintf("%s:%d domain_name must be a string literal", filePath, domainAttr.Range().Start.Line))
		} else if val.AsString() != expected.domainName {
			violations = append(violations, fmt.Sprintf("%s:%d domain_name set to %s (expected %s)", filePath, domainAttr.Range().Start.Line, val.AsString(), expected.domainName))
		}
	}

	validationAttr, ok := block.Body.Attributes["validation_method"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d aws_acm_certificate missing validation_method", filePath, block.Range().Start.Line))
	} else {
		val, diag := validationAttr.Expr.Value(ctx)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d validation_method must be a constant string (%s)", filePath, validationAttr.Range().Start.Line, diag.Error()))
		} else if val.Type() != cty.String {
			violations = append(violations, fmt.Sprintf("%s:%d validation_method must be a string literal", filePath, validationAttr.Range().Start.Line))
		} else if strings.ToUpper(val.AsString()) != "DNS" {
			violations = append(violations, fmt.Sprintf("%s:%d validation_method must be DNS", filePath, validationAttr.Range().Start.Line))
		}
	}

	hasLifecycle := false
	for _, child := range block.Body.Blocks {
		if child.Type != "lifecycle" {
			continue
		}
		hasLifecycle = true
		attr, ok := child.Body.Attributes["create_before_destroy"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d lifecycle block missing create_before_destroy", filePath, child.Range().Start.Line))
			continue
		}
		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() {
			violations = append(violations, fmt.Sprintf("%s:%d create_before_destroy must be a constant bool (%s)", filePath, attr.Range().Start.Line, diag.Error()))
			continue
		}
		if val.Type() != cty.Bool || !val.True() {
			violations = append(violations, fmt.Sprintf("%s:%d create_before_destroy must be true", filePath, attr.Range().Start.Line))
		}
	}
	if !hasLifecycle {
		violations = append(violations, fmt.Sprintf("%s:%d aws_acm_certificate missing lifecycle create_before_destroy", filePath, block.Range().Start.Line))
	}

	return violations
}

func checkCertificateValidationRecord(filePath string, block *hclsyntax.Block, expected acmExpectations, ctx *hcl.EvalContext) []string {
	var violations []string

	zoneAttr, ok := block.Body.Attributes["zone_id"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d certificate validation record missing zone_id", filePath, block.Range().Start.Line))
	} else {
		val, diag := zoneAttr.Expr.Value(ctx)
		if diag.HasErrors() {
			if !isVarReference(zoneAttr.Expr, "route53_zone_id") {
				violations = append(violations, fmt.Sprintf("%s:%d zone_id must resolve to route53_zone_id (%s)", filePath, zoneAttr.Range().Start.Line, diag.Error()))
			}
		} else if val.Type() != cty.String {
			violations = append(violations, fmt.Sprintf("%s:%d zone_id must be a string", filePath, zoneAttr.Range().Start.Line))
		} else if val.AsString() != expected.zoneID {
			violations = append(violations, fmt.Sprintf("%s:%d zone_id set to %s (expected %s)", filePath, zoneAttr.Range().Start.Line, val.AsString(), expected.zoneID))
		}
	}

	return violations
}

func checkCertificateValidationResource(filePath string, block *hclsyntax.Block) []string {
	var violations []string

	arnAttr, ok := block.Body.Attributes["certificate_arn"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d aws_acm_certificate_validation missing certificate_arn", filePath, block.Range().Start.Line))
	} else if !referencesResource(arnAttr.Expr, "aws_acm_certificate", "this") {
		violations = append(violations, fmt.Sprintf("%s:%d certificate_arn should reference aws_acm_certificate.this", filePath, arnAttr.Range().Start.Line))
	}

	recordsAttr, ok := block.Body.Attributes["validation_record_fqdns"]
	if !ok {
		violations = append(violations, fmt.Sprintf("%s:%d aws_acm_certificate_validation missing validation_record_fqdns", filePath, block.Range().Start.Line))
	} else if !referencesResource(recordsAttr.Expr, "aws_route53_record", "certificate_validation") {
		violations = append(violations, fmt.Sprintf("%s:%d validation_record_fqdns should reference aws_route53_record.certificate_validation", filePath, recordsAttr.Range().Start.Line))
	}

	return violations
}

func requireStringAttr(t *testing.T, attrs hclsyntax.Attributes, name string) string {
	t.Helper()

	attr, ok := attrs[name]
	require.Truef(t, ok, "staging tfvars missing %s", name)

	val, diag := attr.Expr.Value(nil)
	require.Falsef(t, diag.HasErrors(), "%s must be a constant string (%s)", name, diag.Error())
	require.Equalf(t, cty.String, val.Type(), "%s must be a string literal", name)

	return val.AsString()
}

func referencesResource(expr hclsyntax.Expression, resourceType string, name string) bool {
	for _, trav := range expr.Variables() {
		if len(trav) < 2 {
			continue
		}

		root, ok := trav[0].(hcl.TraverseRoot)
		if !ok || root.Name != resourceType {
			continue
		}

		attr, ok := trav[1].(hcl.TraverseAttr)
		if !ok || attr.Name != name {
			continue
		}

		return true
	}

	return false
}
