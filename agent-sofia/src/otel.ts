import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Configuration pour Dash0
const serviceName = process.env.OTEL_SERVICE_NAME || 'sofia-agent';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '0.1.0';
const dash0Endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'https://ingress.dash0.com';
const dash0Token = process.env.DASH0_AUTH_TOKEN || '';

// Resource attributes - informations sur le service
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion,
  'deployment.environment': process.env.NODE_ENV || 'development',
  'agent.type': 'eliza-multi-agent',
  'agent.count': '5', // 5 agents: SofIA, ChatBot, Pulse, Recommendation, ThemeExtractor
});

// Headers pour l'authentification Dash0
const headers: Record<string, string> = dash0Token ? {
  'Authorization': `Bearer ${dash0Token}`
} : {};

// Trace Exporter - pour tracer les requêtes
const traceExporter = new OTLPTraceExporter({
  url: `${dash0Endpoint}/v1/traces`,
  headers,
});

// Metric Exporter - pour les métriques custom
const metricExporter = new OTLPMetricExporter({
  url: `${dash0Endpoint}/v1/metrics`,
  headers,
});

// SDK Configuration
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export toutes les 60 secondes
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // HTTP instrumentation - pour tracker les WebSocket et requêtes HTTP
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (request) => {
          // Ignorer les health checks
          return request.url?.includes('/health') || false;
        },
      },
      // FS instrumentation - désactivée par défaut (trop verbose)
      '@opentelemetry/instrumentation-fs': {
        enabled: process.env.DASH0_ENABLE_FS_INSTRUMENTATION === 'true',
      },
    })
  ],
});

// Start SDK
sdk.start();

// Graceful shutdown
const shutdown = async () => {
  try {
    await sdk.shutdown();
    console.log('[OpenTelemetry] SDK shut down successfully');
  } catch (error) {
    console.error('[OpenTelemetry] Error shutting down SDK:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Log startup
if (process.env.DASH0_DEBUG === 'true') {
  console.log('[OpenTelemetry] SDK started with config:', {
    serviceName,
    serviceVersion,
    endpoint: dash0Endpoint,
    hasToken: !!dash0Token,
  });
}

export default sdk;
