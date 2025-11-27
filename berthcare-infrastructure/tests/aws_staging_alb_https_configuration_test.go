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

// **Feature: aws-staging-environment, Property 4: ALB HTTPS Configuration**
// **Validates: Requirements 4.2, 4.3, 4.4, 6.3, 6.4**
func TestAWSStagingALBHTTPSConfiguration(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 4: ALB HTTPS Configuration", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		httpsFound := false
		redirectFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, hasHTTPS, hasRedirect := validateALBListeners(file, content)
			violations = append(violations, fileViolations...)
			httpsFound = httpsFound || hasHTTPS
			redirectFound = redirectFound || hasRedirect
		}

		require.True(t, httpsFound, "expected an HTTPS listener on port 443")
		require.True(t, redirectFound, "expected an HTTP listener redirecting to HTTPS")

		if len(violations) > 0 {
			t.Fatalf("found ALB HTTPS configuration violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateALBListeners(filePath string, content []byte) ([]string, bool, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{filePath + ": unable to parse HCL: " + diag.Error()}, false, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{filePath + ": expected hclsyntax.Body"}, false, false
	}

	var violations []string
	httpsFound := false
	redirectFound := false

	for _, block := range body.Blocks {
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_lb_listener" {
			continue
		}

		portAttr, okPort := block.Body.Attributes["port"]
		if !okPort {
			violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "aws_lb_listener missing port"))
			continue
		}

		if isConstNumber(portAttr, 443) {
			httpsFound = true
			violations = append(violations, checkHTTPSListener(filePath, block)...)
		}

		if isConstNumber(portAttr, 80) {
			redirectFound = true
			violations = append(violations, checkHTTPRedirectListener(filePath, block)...)
		}
	}

	return violations, httpsFound, redirectFound
}

func checkHTTPSListener(filePath string, block *hclsyntax.Block) []string {
	var violations []string

	protoAttr, ok := block.Body.Attributes["protocol"]
	if !ok {
		violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "HTTPS listener missing protocol"))
	} else if !isConstString(protoAttr, "HTTPS") {
		violations = append(violations, formatViolation(filePath, protoAttr.Range().Start.Line, "protocol must be HTTPS"))
	}

	sslAttr, ok := block.Body.Attributes["ssl_policy"]
	if !ok {
		violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "HTTPS listener missing ssl_policy"))
	} else {
		val, diag := sslAttr.Expr.Value(nil)
		if diag.HasErrors() || val.Type() != cty.String {
			violations = append(violations, formatViolation(filePath, sslAttr.Range().Start.Line, "ssl_policy must be a constant string"))
		} else if !isTLS12OrHigher(val.AsString()) {
			violations = append(violations, formatViolation(filePath, sslAttr.Range().Start.Line, "ssl_policy must enforce TLS 1.2+"))
		}
	}

	certAttr, ok := block.Body.Attributes["certificate_arn"]
	if !ok {
		violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "HTTPS listener missing certificate_arn"))
	} else if !certificateARNValid(certAttr) {
		violations = append(violations, formatViolation(filePath, certAttr.Range().Start.Line, "certificate_arn must reference ACM certificate"))
	}

	return violations
}

func checkHTTPRedirectListener(filePath string, block *hclsyntax.Block) []string {
	var violations []string

	protoAttr, ok := block.Body.Attributes["protocol"]
	if !ok {
		violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "HTTP listener missing protocol"))
	} else if !isConstString(protoAttr, "HTTP") {
		violations = append(violations, formatViolation(filePath, protoAttr.Range().Start.Line, "protocol must be HTTP"))
	}

	foundRedirect := false
	for _, child := range block.Body.Blocks {
		if child.Type != "default_action" {
			continue
		}

		actionType, hasType := child.Body.Attributes["type"]
		if !hasType || !isConstString(actionType, "redirect") {
			violations = append(violations, formatViolation(filePath, child.Range().Start.Line, "default_action must be type redirect"))
			continue
		}

		for _, redirect := range child.Body.Blocks {
			if redirect.Type != "redirect" {
				continue
			}

			foundRedirect = true

			if portAttr, ok := redirect.Body.Attributes["port"]; !ok || !isConstString(portAttr, "443") {
				violations = append(violations, formatViolation(filePath, redirect.Range().Start.Line, "redirect.port must be \"443\""))
			}

			if protoAttr, ok := redirect.Body.Attributes["protocol"]; !ok || !isConstString(protoAttr, "HTTPS") {
				violations = append(violations, formatViolation(filePath, redirect.Range().Start.Line, "redirect.protocol must be HTTPS"))
			}

			if statusAttr, ok := redirect.Body.Attributes["status_code"]; !ok || !isConstString(statusAttr, "HTTP_301") {
				violations = append(violations, formatViolation(filePath, redirect.Range().Start.Line, "redirect.status_code must be HTTP_301"))
			}
		}
	}

	if !foundRedirect {
		violations = append(violations, formatViolation(filePath, block.Range().Start.Line, "HTTP listener missing redirect default_action"))
	}

	return violations
}

func isTLS12OrHigher(policy string) bool {
	upper := strings.ToUpper(policy)
	return strings.Contains(upper, "TLS-1-2") || strings.Contains(upper, "TLS-1-3")
}

func certificateARNValid(attr *hclsyntax.Attribute) bool {
	if referencesResource(attr.Expr, "aws_acm_certificate", "this") || isVarReference(attr.Expr, "acm_certificate_arn") {
		return true
	}

	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() || val.Type() != cty.String {
		return false
	}

	return val.AsString() != ""
}

func formatViolation(filePath string, line int, msg string) string {
	return fmt.Sprintf("%s:%d %s", filePath, line, msg)
}
