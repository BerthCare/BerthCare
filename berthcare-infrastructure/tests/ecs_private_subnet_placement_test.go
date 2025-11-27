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

func TestECSPrivateSubnetPlacement(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 5: ECS Private Subnet Placement", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateASGSubnets(file, content)...)
		}

		if len(violations) > 0 {
			t.Fatalf("found ECS subnet placement violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateASGSubnets(filePath string, content []byte) []string {
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
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_autoscaling_group" {
			continue
		}

		attr, ok := block.Body.Attributes["vpc_zone_identifier"]
		if !ok {
			violations = append(violations, fmt.Sprintf("%s:%d autoscaling group missing vpc_zone_identifier", filePath, block.Range().Start.Line))
			continue
		}

		val, diag := attr.Expr.Value(nil)
		if diag.HasErrors() {
			// If the expression references a variable named private_subnet_ids, accept it.
			if isVarReference(attr.Expr, "private_subnet_ids") {
				continue
			}
			violations = append(violations, fmt.Sprintf("%s:%d vpc_zone_identifier must be a constant list or private_subnet_ids", filePath, attr.Range().Start.Line))
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

	return violations
}
