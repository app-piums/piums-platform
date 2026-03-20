// ============================================================================
// @piums/shared-config — Service ports and URLs
// ============================================================================

export const SERVICE_PORTS = {
  GATEWAY: 3000,
  AUTH: 4001,
  USERS: 4002,
  ARTISTS: 4003,
  CATALOG: 4004,
  PAYMENTS: 4005,
  REVIEWS: 4006,
  NOTIFICATIONS: 4007,
  BOOKING: 4008,
  SEARCH: 4009,
  CHAT: 4010,
} as const;

export type ServiceName = keyof typeof SERVICE_PORTS;

export function getServiceUrl(service: ServiceName, host = 'localhost'): string {
  return `http://${host}:${SERVICE_PORTS[service]}`;
}

// Docker-internal URLs (used in docker-compose)
export const DOCKER_SERVICE_URLS: Record<ServiceName, string> = {
  GATEWAY: 'http://gateway:3000',
  AUTH: 'http://auth-service:4001',
  USERS: 'http://users-service:4002',
  ARTISTS: 'http://artists-service:4003',
  CATALOG: 'http://catalog-service:4004',
  PAYMENTS: 'http://payments-service:4005',
  REVIEWS: 'http://reviews-service:4006',
  NOTIFICATIONS: 'http://notifications-service:4007',
  BOOKING: 'http://booking-service:4008',
  SEARCH: 'http://search-service:4009',
  CHAT: 'http://chat-service:4010',
};
