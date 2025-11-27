package tests

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
)

// **Feature: aws-staging-environment, Property 9: Resource Tagging Compliance**
// **Validates: Requirements 9.1, 9.2, 9.3**
func TestAWSStagingResourceTaggingCompliance(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 9: Resource Tagging Compliance", func(t *testing.T) {
		expected := loadStagingTagExpectations(t)

		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string
		providerFound := false

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			fileViolations, found := validateProviderTags(file, content, expected)
			providerFound = providerFound || found
			violations = append(violations, fileViolations...)
		}

		require.True(t, providerFound, "expected at least one aws provider to validate")

		if len(violations) > 0 {
			t.Fatalf("found tagging violations:\n%s", strings.Join(violations, "\n"))
		}
	})
}

func loadStagingTagExpectations(t *testing.T) tagExpectations {
	t.Helper()

	tfvarsPath := filepath.Join(repoRoot, "environments", "staging", "terraform.tfvars")
	content, err := os.ReadFile(tfvarsPath)
	require.NoError(t, err, "expected staging tfvars at %s", tfvarsPath)

	config, diag := hclsyntax.ParseConfig(content, tfvarsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "failed to parse staging tfvars: %s", diag.Error())

	body, ok := config.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected staging tfvars body")

	attrs := body.Attributes

	project := stringAttrOrDefault(t, attrs, "project_name", "berthcare")
	environment := stringAttrOrDefault(t, attrs, "environment", "staging")

	return tagExpectations{
		project:     project,
		environment: environment,
		region:      expectedRegion,
	}
}
