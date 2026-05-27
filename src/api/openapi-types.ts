// Minimal OpenAPI 3.1 type for our spec object (avoids external dependency)
export interface OpenAPIV3 {
  openapi: string
  info: { title: string; version: string; description?: string }
  servers?: Array<{ url: string; description?: string }>
  paths: Record<string, Record<string, unknown>>
  components?: { schemas?: Record<string, unknown> }
}
