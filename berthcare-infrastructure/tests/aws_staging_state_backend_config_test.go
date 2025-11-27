package tests

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
)

// **Feature: aws-staging-environment, Property 8: State Backend Configuration**
// **Validates: Requirements 7.1, 7.2, 7.3**
func TestAWSStagingStateBackendConfiguration(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 8: State Backend Configuration", func(t *testing.T) {
		backendPath := filepath.Join(repoRoot, "environments", "staging", "backend.hcl")
		content, err := os.ReadFile(backendPath)
		require.NoError(t, err, "expected backend config at %s", backendPath)

		config, diag := hclsyntax.ParseConfig(content, backendPath, hcl.Pos{Line: 1, Column: 1})
		require.False(t, diag.HasErrors(), "failed to parse backend.hcl: %s", diag.Error())

		body, ok := config.Body.(*hclsyntax.Body)
		require.True(t, ok, "expected backend.hcl to contain a body")

		attrs := body.Attributes

		bucket := requireStringAttribute(t, attrs, "bucket")
		require.Equal(t, "berthcare-terraform-state", bucket, "state bucket must be berthcare-terraform-state")

		key := requireStringAttribute(t, attrs, "key")
		require.Equal(t, "envs/staging/terraform.tfstate", key, "state key must be unique to staging environment")

		region := requireStringAttribute(t, attrs, "region")
		require.Equal(t, expectedRegion, region, "backend region must be ca-central-1")

		dynamoTable := requireStringAttribute(t, attrs, "dynamodb_table")
		require.Equal(t, "berthcare-terraform-locks", dynamoTable, "backend must enable DynamoDB state locking")

		encrypt := requireBoolAttribute(t, attrs, "encrypt")
		require.True(t, encrypt, "backend must enable encryption")
	})
}
