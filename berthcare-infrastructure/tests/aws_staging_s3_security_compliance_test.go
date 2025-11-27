package tests

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// **Feature: aws-staging-environment, Property 3: S3 Security Compliance**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
func TestAWSStagingS3SecurityCompliance(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 3: S3 Security Compliance", func(t *testing.T) {
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
