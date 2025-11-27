package tests

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// **Feature: aws-staging-environment, Property 5: ECS Private Subnet Placement**
// **Validates: Requirements 4.5**
func TestAWSStagingECSPrivateSubnetPlacement(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 5: ECS Private Subnet Placement", func(t *testing.T) {
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
