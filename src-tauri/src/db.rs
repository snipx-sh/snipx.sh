// rusqlite schema and migrations
// The API (Bun + ElysiaJS) is the primary database owner.
// This module provides read-only access for Tauri-side operations
// when the API is not available (future offline support).

// Phase 4 implementation - currently unused.
// The Tauri app delegates all database operations to the HTTP API.
