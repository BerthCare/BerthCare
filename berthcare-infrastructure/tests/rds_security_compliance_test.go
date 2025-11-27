package tests

import (
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

func TestRDSSecurityCompliance(t *testing.T) {
	t.Run("Feature: infrastructure-repository-setup, Property 3: RDS Security Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		backupDefault, hasBackupDefault := readBackupRetentionDefault(t)

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations := validateRDSResources(file, content, backupDefault, hasBackupDefault)
			violations = append(violations, fileViolations...)
		}

		if len(violations) > 0 {
			t.Fatalf("found RDS security violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func validateRDSResources(filePath string, content []byte, backupDefault *big.Float, hasBackupDefault bool) []string {
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
		if block.Type != "resource" || len(block.Labels) < 2 || block.Labels[0] != "aws_db_instance" {
			continue
		}

		violations = append(violations, enforceBoolAttr(filePath, block, "storage_encrypted", true)...)
		violations = append(violations, enforceBoolAttr(filePath, block, "publicly_accessible", false)...)
		violations = append(violations, enforceBackupRetention(filePath, block, backupDefault, hasBackupDefault)...)
	}

	return violations
}

func enforceBoolAttr(filePath string, block *hclsyntax.Block, attrName string, expected bool) []string {
	attr, ok := block.Body.Attributes[attrName]
	if !ok {
		return []string{fmt.Sprintf("%s:%d aws_db_instance missing %s", filePath, block.Range().Start.Line, attrName)}
	}

	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() {
		return []string{fmt.Sprintf("%s:%d %s must be a constant boolean (%s)", filePath, attr.Range().Start.Line, attrName, diag.Error())}
	}

	if val.Type() != cty.Bool {
		return []string{fmt.Sprintf("%s:%d %s must be a boolean literal", filePath, attr.Range().Start.Line, attrName)}
	}

	if val.True() != expected {
		return []string{fmt.Sprintf("%s:%d %s must be %t", filePath, attr.Range().Start.Line, attrName, expected)}
	}

	return nil
}

func enforceBackupRetention(filePath string, block *hclsyntax.Block, backupDefault *big.Float, hasBackupDefault bool) []string {
	attr, ok := block.Body.Attributes["backup_retention_period"]
	if !ok {
		return []string{fmt.Sprintf("%s:%d aws_db_instance missing backup_retention_period", filePath, block.Range().Start.Line)}
	}

	val, diag := attr.Expr.Value(nil)
	if diag.HasErrors() {
		if isVarReference(attr.Expr, "backup_retention_period") && hasBackupDefault && backupDefault.Cmp(big.NewFloat(7)) >= 0 {
			return nil
		}
		return []string{fmt.Sprintf("%s:%d backup_retention_period must be a constant number or a variable with default >= 7 (%s)", filePath, attr.Range().Start.Line, diag.Error())}
	}

	if !val.Type().Equals(cty.Number) {
		return []string{fmt.Sprintf("%s:%d backup_retention_period must be a number literal", filePath, attr.Range().Start.Line)}
	}

	bf := val.AsBigFloat()

	if bf.Cmp(big.NewFloat(7)) < 0 {
		return []string{fmt.Sprintf("%s:%d backup_retention_period must be >= 7", filePath, attr.Range().Start.Line)}
	}

	return nil
}

func isVarReference(expr hclsyntax.Expression, name string) bool {
	for _, trav := range expr.Variables() {
		if len(trav) != 2 {
			continue
		}
		root, ok := trav[0].(hcl.TraverseRoot)
		if !ok || root.Name != "var" {
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

func readBackupRetentionDefault(t *testing.T) (*big.Float, bool) {
	t.Helper()

	varsPath := filepath.Join(repoRoot, "modules", "rds", "variables.tf")
	content, err := os.ReadFile(varsPath)
	if err != nil {
		return nil, false
	}

	parsedFile, diag := hclsyntax.ParseConfig(content, varsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "expected %s to parse: %s", varsPath, diag.Error())

	body, ok := parsedFile.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected %s body to be hclsyntax.Body", varsPath)

	for _, block := range body.Blocks {
		if block.Type != "variable" || len(block.Labels) == 0 || block.Labels[0] != "backup_retention_period" {
			continue
		}

		defAttr, ok := block.Body.Attributes["default"]
		if !ok {
			return nil, false
		}

		val, valDiag := defAttr.Expr.Value(nil)
		if valDiag.HasErrors() {
			return nil, false
		}

		if !val.Type().Equals(cty.Number) {
			return nil, false
		}

	return val.AsBigFloat(), true
	}

	return nil, false
}
