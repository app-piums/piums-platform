-- ============================================================================
-- Initialize Piums Databases
-- ============================================================================
-- Este script crea todas las bases de datos necesarias para los microservicios
-- Se ejecuta automáticamente cuando se levanta el contenedor de PostgreSQL

\c postgres;

-- Crear bases de datos para cada microservicio
CREATE DATABASE piums_auth;
CREATE DATABASE piums_users;
CREATE DATABASE piums_artists;
CREATE DATABASE piums_catalog;
CREATE DATABASE piums_bookings;
CREATE DATABASE piums_payments;
CREATE DATABASE piums_reviews;
CREATE DATABASE piums_notifications;
CREATE DATABASE piums_search;
CREATE DATABASE piums_chat;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE piums_auth TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_users TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_artists TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_catalog TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_bookings TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_payments TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_reviews TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_notifications TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_search TO piums;
GRANT ALL PRIVILEGES ON DATABASE piums_chat TO piums;

-- Confirmar creación
\l
