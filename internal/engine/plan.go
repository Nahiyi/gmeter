package engine

// TestPlan describes the request and user inputs shared by CLI and desktop.
type TestPlan struct {
	Name    string
	Request RequestSpec
	Users   []UserSpec
}

// RequestSpec describes the HTTP request used by all worker threads.
type RequestSpec struct {
	Method  string
	URL     string
	Headers map[string]string
	Body    string
}

// UserSpec contains per-thread user overrides.
type UserSpec struct {
	Headers map[string]string
}
