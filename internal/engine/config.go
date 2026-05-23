package engine

import "gmeter/internal/config"

// TestPlanFromConfig converts the JSON config model into the shared engine model.
func TestPlanFromConfig(cfg *config.Config) TestPlan {
	if cfg == nil {
		return TestPlan{}
	}
	users := make([]UserSpec, 0, len(cfg.Users))
	for _, user := range cfg.Users {
		users = append(users, UserSpec{Headers: user.Headers})
	}
	return TestPlan{
		Request: RequestSpec{
			Method:  cfg.Request.Method,
			URL:     cfg.Request.URL,
			Headers: cfg.Request.Headers,
			Body:    cfg.Request.Body,
		},
		Users: users,
	}
}
