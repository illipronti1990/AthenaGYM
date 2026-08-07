/**
 * Optional OpenTelemetry bootstrap.
 * Activated when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 * Avoids hard dependency on @opentelemetry/* packages in serverless cold starts.
 */
export function startOtelIfConfigured(serviceName: string): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;
  // eslint-disable-next-line no-console
  console.log(
    `[otel] OTEL_EXPORTER_OTLP_ENDPOINT set (${endpoint}) for ${serviceName} — wire collector sidecar; SDK packages optional`,
  );
}
