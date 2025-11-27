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

func TestS3SecurityCompliance(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 4: S3 Security Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateS3Security(file, content)...)
		}

		if len(violations) > 0 {
			t.Fatalf("found S3 security violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateS3Security(filePath string, content []byte) []string {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}
	}

	var violations []string

	for _, block := range body.Blocks {
		if block.Type == "resource" && len(block.Labels) >= 2 && block.Labels[0] == "aws_s3_bucket" {
			violations = append(violations, checkBucketEncryption(filePath, block)...)
			violations = append(violations, checkBucketVersioning(filePath, block)...)
		}

		if block.Type == "resource" && len(block.Labels) >= 2 && block.Labels[0] == "aws_s3_bucket_public_access_block" {
			violations = append(violations, checkBucketPublicAccessBlock(filePath, block)...)
		}
	}

	return violations
}

func checkBucketEncryption(filePath string, block *hclsyntax.Block) []string {
	for _, nested := range block.Body.Blocks {
		if nested.Type != "server_side_encryption_configuration" {
			continue
		}

		for _, rule := range nested.Body.Blocks {
			if rule.Type != "rule" {
				continue
			}
			for _, apply := range rule.Body.Blocks {
				if apply.Type != "apply_server_side_encryption_by_default" {
					continue
				}
				attr, ok := apply.Body.Attributes["sse_algorithm"]
				if !ok {
					return []string{fmt.Sprintf("%s:%d missing sse_algorithm in encryption block", filePath, apply.Range().Start.Line)}
				}

				val, diag := attr.Expr.Value(nil)
				if diag.HasErrors() || val.Type() != cty.String || val.AsString() != "AES256" {
					return []string{fmt.Sprintf("%s:%d sse_algorithm must be AES256", filePath, attr.Range().Start.Line)}
				}
				return nil
			}
		}
	}

	return []string{fmt.Sprintf("%s:%d aws_s3_bucket missing server_side_encryption_configuration", filePath, block.Range().Start.Line)}
}

func checkBucketVersioning(filePath string, block *hclsyntax.Block) []string {
	for _, nested := range block.Body.Blocks {
		if nested.Type != "versioning" {
			continue
		}

		attr, ok := nested.Body.Attributes["enabled"]
		if !ok {
			return []string{fmt.Sprintf("%s:%d versioning block missing enabled", filePath, nested.Range().Start.Line)}
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() || val.Type() != cty.Bool || !val.True() {
			return []string{fmt.Sprintf("%s:%d versioning.enabled must be true", filePath, attr.Range().Start.Line)}
		}

		return nil
	}

	return []string{fmt.Sprintf("%s:%d aws_s3_bucket missing versioning block", filePath, block.Range().Start.Line)}
}

func checkBucketPublicAccessBlock(filePath string, block *hclsyntax.Block) []string {
	required := map[string]bool{
		"block_public_acls":       false,
		"block_public_policy":     false,
		"ignore_public_acls":      false,
		"restrict_public_buckets": false,
	}

	var violations []string
	for name := range required {
		attr, ok := block.Body.Attributes[name]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d public access block missing %s", filePath, block.Range().Start.Line, name))
			continue
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() || val.Type() != cty.Bool || !val.True() {
			violations = append(violations, fmt.Sprintf("%s:%d %s must be true", filePath, attr.Range().Start.Line, name))
		}

		required[name] = true
	}

	return violations
}
