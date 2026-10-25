package app

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"mediguide/internal/handlers"
	"mediguide/internal/middleware"
	"mediguide/internal/security"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestCalculatorUsageAnalyticsAuthorization(t *testing.T) {
	for _, tc := range []struct {
		name          string
		perms         []string
		authenticated bool
		want          int
	}{
		{"anonymous", nil, false, http.StatusUnauthorized},
		{"tool reader", []string{"calculator.read"}, true, http.StatusForbidden},
		{"tool author", []string{"calculator.write"}, true, http.StatusForbidden},
		// An invalid ID reaches the handler only after authorization succeeds.
		{"analyst", []string{"analytics.read"}, true, http.StatusBadRequest},
		{"administrator", []string{"admin.all"}, true, http.StatusBadRequest},
	} {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			group := router.Group("/api/v2", func(c *gin.Context) {
				if tc.authenticated {
					c.Set(middleware.ClaimsKey, &security.Claims{UserID: uuid.New(), Perms: tc.perms})
				}
				c.Next()
			})
			registerCalculatorsRoutes(group, middleware.NewRateLimiter(nil, "test", false), handlers.CalculatorHandler{})
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v2/calculators/invalid/usage", nil))
			if response.Code != tc.want {
				t.Fatalf("status %d, expected %d: %s", response.Code, tc.want, response.Body.String())
			}
		})
	}
}
