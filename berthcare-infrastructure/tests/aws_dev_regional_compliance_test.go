package tests

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// **Feature: aws-dev-environment, Property 1: Regional Compliance**
// **Validates: Requirements 1.1, 1.2**
func TestAWSDevRegionalCompliance(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 1: Regional Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateRegions(file, content)...)
		}

		if len(violations) > 0 {
			t.Fatalf("found region violations (expected %s):\n%s", expectedRegion, strings.Join(violations, "\n"))
		}
	})
}
