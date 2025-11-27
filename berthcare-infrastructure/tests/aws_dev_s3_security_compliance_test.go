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

// **Feature: aws-dev-environment, Property 3: S3 Security Compliance**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
func TestAWSDevS3SecurityCompliance(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 3: S3 Security Compliance", func(t *testing.T) {
		taskRoleArn := loadDevTaskRoleArn(t)

		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		policyFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateS3Security(file, content)...)

			fileViolations, found := validateS3BucketPolicies(file, content, taskRoleArn)
			violations = append(violations, fileViolations...)
			policyFound = policyFound || found
		}

		require.True(t, policyFound, "expected at least one S3 bucket policy to validate")

		if len(violations) > 0 {
			t.Fatalf("found S3 security violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func loadDevTaskRoleArn(t *testing.T) string {
	t.Helper()

	tfvarsPath := filepath.Join(repoRoot, "environments", "dev", "terraform.tfvars")
	content, err := os.ReadFile(tfvarsPath)
	require.NoError(t, err, "expected dev tfvars at %s", tfvarsPath)

	config, diag := hclsyntax.ParseConfig(content, tfvarsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "failed to parse dev tfvars: %s", diag.Error())

	body, ok := config.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected dev tfvars body")

	attrs := body.Attributes

	taskRoleArn := stringAttrOrDefault(t, attrs, "task_role_arn", "")
	require.NotEmpty(t, taskRoleArn, "dev tfvars must set task_role_arn")

	return taskRoleArn
}

func validateS3BucketPolicies(filePath string, content []byte, expectedRole string) ([]string, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false
	}

	var violations []string
	found := false

	ctx := &hcl.EvalContext{
		Variables: map[string]cty.Value{
			"var": cty.ObjectVal(map[string]cty.Value{
				"task_role_arn": cty.StringVal(expectedRole),
			}),
		},
	}

	for _, block := range body.Blocks {
		if block.Type != "data" || len(block.Labels) < 2 || block.Labels[0] != "aws_iam_policy_document" {
			continue
		}

		if block.Labels[1] != "photos" && block.Labels[1] != "exports" {
			continue
		}

		for _, stmt := range block.Body.Blocks {
			if stmt.Type != "statement" {
				continue
			}

			for _, principal := range stmt.Body.Blocks {
				if principal.Type != "principals" {
					continue
				}

				found = true

				typeAttr, ok := principal.Body.Attributes["type"]
				if !ok || !isConstString(typeAttr, "AWS") {
					violations = append(violations, fmt.Sprintf("%s:%d principals.type must be \"AWS\"", filePath, principal.Range().Start.Line))
					continue
				}

				identifiersAttr, ok := principal.Body.Attributes["identifiers"]
				if !ok {
					violations = append(violations, fmt.Sprintf("%s:%d principals missing identifiers", filePath, principal.Range().Start.Line))
					continue
				}

				val, identDiag := identifiersAttr.Expr.Value(ctx)
				if identDiag.HasErrors() {
					violations = append(violations, fmt.Sprintf("%s:%d identifiers must be a constant or resolvable list (%s)", filePath, identifiersAttr.Range().Start.Line, identDiag.Error()))
					continue
				}

				if !val.Type().IsListType() && !val.Type().IsTupleType() {
					violations = append(violations, fmt.Sprintf("%s:%d identifiers must be a list", filePath, identifiersAttr.Range().Start.Line))
					continue
				}

				if val.LengthInt() != 1 {
					violations = append(violations, fmt.Sprintf("%s:%d identifiers must contain only the ECS task role", filePath, identifiersAttr.Range().Start.Line))
					continue
				}

				elem := val.Index(cty.NumberIntVal(0))
				if elem.Type() != cty.String {
					violations = append(violations, fmt.Sprintf("%s:%d identifiers[0] must be string", filePath, identifiersAttr.Range().Start.Line))
					continue
				}

				if elem.AsString() != expectedRole {
					violations = append(violations, fmt.Sprintf("%s:%d identifiers[0] must equal task_role_arn (%s)", filePath, identifiersAttr.Range().Start.Line, expectedRole))
				}
			}
		}
	}

	return violations, found
}
