package tests

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// **Feature: branch-protection-pr-templates, Property 1: PR Template Contains All Required Sections**
// **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
func TestPRTemplateContainsRequiredSections(t *testing.T) {
	t.Run("Feature: branch-protection-pr-templates, Property 1: PR Template Contains All Required Sections", func(t *testing.T) {
		templatePath := filepath.Join(repoRoot, ".github", "PULL_REQUEST_TEMPLATE.md")
		content, err := os.ReadFile(templatePath)
		require.NoError(t, err, "expected to read PR template at %s", templatePath)

		normalized := strings.ReplaceAll(string(content), "\r\n", "\n")
		requiredSections := []string{
			"## Description",
			"## Links to Specs",
			"## Test Plan",
			"## Screenshots",
		}

		for _, section := range requiredSections {
			require.Truef(t, containsHeading(normalized, section), "missing section heading: %s", section)
		}
	})
}

func containsHeading(content, heading string) bool {
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		if strings.TrimSpace(line) == heading {
			return true
		}
	}
	return false
}
