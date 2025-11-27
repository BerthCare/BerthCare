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

// **Feature: aws-dev-environment, Property 4: ECS Private Subnet Placement**
// **Validates: Requirements 4.5**
func TestAWSDevECSPrivateSubnetPlacement(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 4: ECS Private Subnet Placement", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		asgChecked := false
		albChecked := false
		natChecked := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			asgViolations, foundASG := validateECSASGPrivateSubnets(file, content)
			violations = append(violations, asgViolations...)
			asgChecked = asgChecked || foundASG

			albViolations, foundALB := validateALBPublicSubnets(file, content)
			violations = append(violations, albViolations...)
			albChecked = albChecked || foundALB

			natViolations, foundNAT := validatePrivateNatRoute(file, content)
			violations = append(violations, natViolations...)
			natChecked = natChecked || foundNAT
		}

		require.True(t, asgChecked, "expected at least one ECS autoscaling group to validate")
		require.True(t, albChecked, "expected at least one ALB to validate")
		require.True(t, natChecked, "expected at least one NAT gateway route for private subnets")

		if len(violations) > 0 {
			t.Fatalf("found ECS private subnet placement violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateECSASGPrivateSubnets(filePath string, content []byte) ([]string, bool) {
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
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_autoscaling_group" {
			continue
		}

		found = true

		attr, ok := block.Body.Attributes["vpc_zone_identifier"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d autoscaling group missing vpc_zone_identifier", filePath, block.Range().Start.Line))
			continue
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() {
			if isVarReference(attr.Expr, "private_subnet_ids") {
				continue
			}
			violations = append(violations, fmt.Sprintf("%s:%d vpc_zone_identifier must be a constant list or private_subnet_ids (%s)", filePath, attr.Range().Start.Line, diag.Error()))
			continue
		}

		if !val.Type().IsListType() && !val.Type().IsTupleType() {
			violations = append(violations, fmt.Sprintf("%s:%d vpc_zone_identifier must be a list of subnet IDs", filePath, attr.Range().Start.Line))
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

func validateALBPublicSubnets(filePath string, content []byte) ([]string, bool) {
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
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_lb" {
			continue
		}

		found = true

		attr, ok := block.Body.Attributes["subnets"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d ALB missing subnets", filePath, block.Range().Start.Line))
			continue
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() {
			if isVarReference(attr.Expr, "public_subnet_ids") {
				continue
			}
			violations = append(violations, fmt.Sprintf("%s:%d ALB subnets must be a constant list or public_subnet_ids (%s)", filePath, attr.Range().Start.Line, diag.Error()))
			continue
		}

		if !val.Type().IsListType() && !val.Type().IsTupleType() {
			violations = append(violations, fmt.Sprintf("%s:%d ALB subnets must be a list", filePath, attr.Range().Start.Line))
			continue
		}

		for i := 0; i < val.LengthInt(); i++ {
			elem := val.Index(cty.NumberIntVal(int64(i)))
			if elem.Type() != cty.String {
				violations = append(violations, fmt.Sprintf("%s:%d ALB subnet id at index %d must be string", filePath, attr.Range().Start.Line, i))
			}
		}
	}

	return violations, found
}

func validatePrivateNatRoute(filePath string, content []byte) ([]string, bool) {
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
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_route_table" {
			continue
		}

		for _, route := range block.Body.Blocks {
			if route.Type != "route" {
				continue
			}

			natAttr, ok := route.Body.Attributes["nat_gateway_id"]
			if !ok {
				continue
			}

			found = true

			if cidrAttr, ok := route.Body.Attributes["cidr_block"]; ok {
				val, cidrDiag := cidrAttr.Expr.Value(nil)
				if cidrDiag.HasErrors() || val.Type() != cty.String || val.AsString() != "0.0.0.0/0" {
					violations = append(violations, fmt.Sprintf("%s:%d nat route must cover 0.0.0.0/0", filePath, cidrAttr.Range().Start.Line))
				}
			}

			// Presence of nat_gateway_id is sufficient; allow it to reference a resource.
			if _, natDiag := natAttr.Expr.Value(nil); natDiag.HasErrors() && !hasResourceReference(natAttr.Expr, "aws_nat_gateway") {
				violations = append(violations, fmt.Sprintf("%s:%d nat_gateway_id must reference a NAT gateway", filePath, natAttr.Range().Start.Line))
			}
		}
	}

	return violations, found
}

func hasResourceReference(expr hclsyntax.Expression, resourceType string) bool {
	for _, trav := range expr.Variables() {
		if len(trav) < 2 {
			continue
		}

		root, ok := trav[0].(hcl.TraverseRoot)
		if !ok {
			continue
		}

		if root.Name == resourceType {
			return true
		}
	}
	return false
}
