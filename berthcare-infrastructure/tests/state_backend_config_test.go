package tests

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

// **Feature: aws-dev-environment, Property 5: State Backend Configuration**
// **Validates: Requirements 6.1, 6.2, 6.3**
func TestStateBackendConfiguration(t *testing.T) {
	t.Run("Feature: aws-dev-environment, Property 5: State Backend Configuration", func(t *testing.T) {
		backendPath := filepath.Join(repoRoot, "environments", "dev", "backend.hcl")
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
		require.Equal(t, "envs/dev/terraform.tfstate", key, "state key must be unique to dev environment")

		region := requireStringAttribute(t, attrs, "region")
		require.Equal(t, expectedRegion, region, "backend region must be ca-central-1")

		dynamoTable := requireStringAttribute(t, attrs, "dynamodb_table")
		require.Equal(t, "berthcare-terraform-locks", dynamoTable, "backend must enable DynamoDB state locking")

		encrypt := requireBoolAttribute(t, attrs, "encrypt")
		require.True(t, encrypt, "backend must enable encryption")
	})
}

func requireStringAttribute(t *testing.T, attrs hclsyntax.Attributes, name string) string {
	t.Helper()

	attr, ok := attrs[name]
	require.Truef(t, ok, "backend.hcl missing %s", name)

	val, diag := attr.Expr.Value(nil)
	require.Falsef(t, diag.HasErrors(), "%s must be a constant string (%s)", name, diag.Error())
	require.Equalf(t, cty.String, val.Type(), "%s must be a string literal", name)

	return val.AsString()
}

func requireBoolAttribute(t *testing.T, attrs hclsyntax.Attributes, name string) bool {
	t.Helper()

	attr, ok := attrs[name]
	require.Truef(t, ok, "backend.hcl missing %s", name)

	val, diag := attr.Expr.Value(nil)
	require.Falsef(t, diag.HasErrors(), "%s must be a constant bool (%s)", name, diag.Error())
	require.Equalf(t, cty.Bool, val.Type(), "%s must be a bool literal", name)

	return val.True()
}
