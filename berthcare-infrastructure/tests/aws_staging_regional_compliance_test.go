package tests

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/hashicorp/hcl/v2"
	"github.com/hashicorp/hcl/v2/hclsyntax"
	"github.com/stretchr/testify/require"
	"github.com/zclconf/go-cty/cty"
)

// **Feature: aws-staging-environment, Property 1: Regional Compliance**
// **Validates: Requirements 1.1, 1.2, 1.3**
func TestAWSStagingRegionalCompliance(t *testing.T) {
	t.Run("Feature: aws-staging-environment, Property 1: Regional Compliance", func(t *testing.T) {
		tfFiles, err := collectTerraformFiles(repoRoot)
		require.NoError(t, err)
		require.NotEmpty(t, tfFiles, "expected Terraform files to validate")

		var violations []string

		for _, file := range tfFiles {
			content, readErr := os.ReadFile(file)
			require.NoError(t, readErr)

			violations = append(violations, validateRegions(file, content)...)
		}

		stagingTfvars := filepath.Join(repoRoot, "environments", "staging", "terraform.tfvars")
		zones := loadStagingAvailabilityZones(t, stagingTfvars)

		for i, az := range zones {
			if !strings.HasPrefix(az, expectedRegion) {
				violations = append(violations, fmt.Sprintf("%s availability_zones[%d] must be in %s (got %s)", stagingTfvars, i, expectedRegion, az))
			}
		}

		if len(violations) > 0 {
			t.Fatalf("found region violations (expected %s):\n%s", expectedRegion, strings.Join(violations, "\n"))
		}
	})
}

func loadStagingAvailabilityZones(t *testing.T, tfvarsPath string) []string {
	t.Helper()

	content, err := os.ReadFile(tfvarsPath)
	require.NoError(t, err, "expected staging tfvars at %s", tfvarsPath)

	config, diag := hclsyntax.ParseConfig(content, tfvarsPath, hcl.Pos{Line: 1, Column: 1})
	require.False(t, diag.HasErrors(), "failed to parse staging tfvars: %s", diag.Error())

	body, ok := config.Body.(*hclsyntax.Body)
	require.True(t, ok, "expected staging tfvars to contain a body")

	attr, ok := body.Attributes["availability_zones"]
	require.True(t, ok, "staging tfvars missing availability_zones")

	val, diag := attr.Expr.Value(nil)
	require.False(t, diag.HasErrors(), "availability_zones must be a constant list (%s)", diag.Error())
	require.True(t, val.Type().IsListType() || val.Type().IsTupleType(), "availability_zones must be a list")
	require.Greater(t, val.LengthInt(), 0, "availability_zones must not be empty")

	zones := make([]string, 0, val.LengthInt())
	for i := 0; i < val.LengthInt(); i++ {
		elem := val.Index(cty.NumberIntVal(int64(i)))
		require.Equalf(t, cty.String, elem.Type(), "availability_zones[%d] must be string", i)
		zones = append(zones, elem.AsString())
	}

	return zones
}
