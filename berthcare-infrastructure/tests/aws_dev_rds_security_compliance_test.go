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

// **Feature: aws-dev-environment, Property 2: RDS Security Compliance**
// **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
func TestAWSDevRDSSecurityCompliance(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 2: RDS Security Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		backupDefault, hasBackupDefault := readBackupRetentionDefault(t)

		var violations []string
		subnetGroupFound := false
		sgRuleFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateRDSResources(file, content, backupDefault, hasBackupDefault)...)
			fileSubnetViolations, foundSubnet := validateRDSSubnetGroups(file, content)
			violations = append(violations, fileSubnetViolations...)
			subnetGroupFound = subnetGroupFound || foundSubnet

			fileSGViolations, foundRule := validateRDSSecurityGroups(file, content)
			violations = append(violations, fileSGViolations...)
			sgRuleFound = sgRuleFound || foundRule
		}

		require.True(t, subnetGroupFound, "expected at least one aws_db_subnet_group to validate")
		require.True(t, sgRuleFound, "expected at least one postgres ingress rule tied to ECS tasks")

		if len(violations) > 0 {
			t.Fatalf("found RDS security violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateRDSSubnetGroups(filePath string, content []byte) ([]string, bool) {
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

	for _, block := range body.Blocks {
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_db_subnet_group" {
			continue
		}

		found = true

		attr, ok := block.Body.Attributes["subnet_ids"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d db subnet group missing subnet_ids", filePath, block.Range().Start.Line))
			continue
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() {
			if isVarReference(attr.Expr, "private_subnet_ids") {
				continue
			}
			violations = append(violations, fmt.Sprintf("%s:%d subnet_ids must be a constant list or private_subnet_ids (%s)", filePath, attr.Range().Start.Line, diag.Error()))
			continue
		}

		if !val.Type().IsListType() && !val.Type().IsTupleType() {
			violations = append(violations, fmt.Sprintf("%s:%d subnet_ids must be a list of subnet IDs", filePath, attr.Range().Start.Line))
			continue
		}

		for i := 0; i < val.LengthInt(); i++ {
			elem := val.Index(cty.NumberIntVal(int64(i)))
			if elem.Type() != cty.String {
				violations = append(violations, fmt.Sprintf("%s:%d subnet id at index %d must be string", filePath, attr.Range().Start.Line, i))
			}
		}
	}

	return violations, found
}

func validateRDSSecurityGroups(filePath string, content []byte) ([]string, bool) {
	parsedFile, diag := hclsyntax.ParseConfig(content, filePath, hcl.Pos{Line: 1, Column: 1})
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s: unable to parse HCL: %s", filePath, diag.Error())}, false
	}

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	if !ok {
		return []string{fmt.Sprintf("%s: expected hclsyntax.Body", filePath)}, false
	}

	var violations []string
	foundRule := false
	checked := false

	for _, block := range body.Blocks {
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_security_group" {
			continue
		}

		for _, nested := range block.Body.Blocks {
			if nested.Type != "ingress" {
				continue
			}

			from, okFrom := nested.Body.Attributes["from_port"]
			to, okTo := nested.Body.Attributes["to_port"]
			protocolAttr, okProto := nested.Body.Attributes["protocol"]
			if !okFrom || !okTo || !okProto {
				continue
			}

			if !isConstNumber(from, 5432) || !isConstNumber(to, 5432) || !isConstString(protocolAttr, "tcp") {
				continue
			}

			checked = true

			sgAttr, ok := nested.Body.Attributes["security_groups"]
			if !ok {
				violations = append(violations, fmt.Sprintf("%s:%d postgres ingress must restrict to ECS task security group via security_groups", filePath, nested.Range().Start.Line))
				continue
			}

			val, sgDiag := sgAttr.Expr.Value(nil)
			if sgDiag.HasErrors() {
				if !isVarReference(sgAttr.Expr, "allowed_security_group_id") {
					violations = append(violations, fmt.Sprintf("%s:%d security_groups must reference allowed_security_group_id or be a constant list (%s)", filePath, sgAttr.Range().Start.Line, sgDiag.Error()))
				}
			} else {
				if !val.Type().IsListType() && !val.Type().IsTupleType() {
					violations = append(violations, fmt.Sprintf("%s:%d security_groups must be a list of security group IDs", filePath, sgAttr.Range().Start.Line))
				} else if val.LengthInt() == 0 {
					violations = append(violations, fmt.Sprintf("%s:%d security_groups must include ECS task security group", filePath, sgAttr.Range().Start.Line))
				} else {
					for i := 0; i < val.LengthInt(); i++ {
						elem := val.Index(cty.NumberIntVal(int64(i)))
						if elem.Type() != cty.String {
							violations = append(violations, fmt.Sprintf("%s:%d security_groups[%d] must be string", filePath, sgAttr.Range().Start.Line, i))
						}
					}
				}
			}

			if cidrAttr, ok := nested.Body.Attributes["cidr_blocks"]; ok {
				if val, diag := cidrAttr.Expr.Value(nil); !diag.HasErrors() && val.LengthInt() > 0 {
					violations = append(violations, fmt.Sprintf("%s:%d postgres ingress should not allow cidr_blocks", filePath, cidrAttr.Range().Start.Line))
				}
			}

			if cidr6Attr, ok := nested.Body.Attributes["ipv6_cidr_blocks"]; ok {
				if val, diag := cidr6Attr.Expr.Value(nil); !diag.HasErrors() && val.LengthInt() > 0 {
					violations = append(violations, fmt.Sprintf("%s:%d postgres ingress should not allow ipv6_cidr_blocks", filePath, cidr6Attr.Range().Start.Line))
				}
			}

			foundRule = true
		}
	}

	if checked && !foundRule {
		violations = append(violations, fmt.Sprintf("%s missing postgres ingress restricted to ECS tasks", filePath))
	}

	return violations, foundRule
}

func isConstNumber(attr *hclsyntax.Attribute, expected int) bool {
	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() {
		return false
	}
	if !val.Type().Equals(cty.Number) {
		return false
	}
	if i, _ := val.AsBigFloat().Int64(); i != int64(expected) {
		return false
	}
	return true
}

func isConstString(attr *hclsyntax.Attribute, expected string) bool {
	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() {
		return false
	}
	if val.Type() != cty.String {
		return false
	}
	return val.AsString() == expected
}
