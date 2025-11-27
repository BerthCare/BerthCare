package tests

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// **Feature: aws-staging-environment, Property 2: RDS Security Compliance**
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
func TestAWSStagingRDSSecurityCompliance(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 2: RDS Security Compliance", func(t *testing.T) {
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
