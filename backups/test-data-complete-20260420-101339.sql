-- ============================================================================
-- BACKUP: Escenario Completo de Prueba
-- Cliente: client01@piums.com (Ana Cifuentes)
-- Artistas: Rob Photography, DJ Eventos, Diego Ink
-- Contiene: 6 servicios, 7 reservas, 3 conversaciones con 14 mensajes, 3 reviews
-- Fecha: Mon Apr 20 10:13:39 CST 2026
-- ============================================================================

-- Categorías y Servicios

\restrict hK1e7FN5abA9Tkqbg9xgd6kSSIiZbQiA7MTh7Ao6B0IMrUq2NfyLtfhuNCgwrEB


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COPY public.service_categories (id, name, slug, description, icon, image, "parentId", level, path, "order", "isActive", "isFeatured", "metaTitle", "metaDescription", keywords, "serviceCount", "primaryColor", "secondaryColor", "createdAt", "updatedAt") FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Fotografía	fotografia	Servicios de fotografía profesional	camera	\N	\N	0	\N	1	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	DJ y Música	dj-musica	Servicios de DJ y entretenimiento musical	music	\N	\N	0	\N	2	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
cccccccc-cccc-cccc-cccc-cccccccccccc	Tatuajes	tatuajes	Servicios de tatuaje profesional	pen	\N	\N	0	\N	3	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
\.



COPY public.services (id, "artistId", name, slug, description, "categoryId", "cityId", "pricingType", "basePrice", currency, "durationMin", "durationMax", images, thumbnail, status, "isAvailable", "isFeatured", "whatIsIncluded", "requiresDeposit", "depositAmount", "depositPercentage", "requiresConsultation", "cancellationPolicy", "termsAndConditions", tags, "isMainService", "minGuests", "maxGuests", "viewCount", "bookingCount", "createdAt", "updatedAt") FROM stdin;
f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1	5e83275d-661e-4f51-b011-ff859299dd53	Sesión Fotográfica 2 Horas	sesion-foto-2h	Sesión de fotos profesional, incluye 50-100 fotos editadas con garantía de calidad	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	\N	FIXED	75000	GTQ	120	120	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	5e83275d-661e-4f51-b011-ff859299dd53	Cobertura de Boda Completa	boda-completa	Cobertura de 8 horas de boda, 300+ fotos editadas, álbum digital premium incluido	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	\N	FIXED	250000	GTQ	480	480	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3	e41eae36-88fb-43f1-aced-9b299c0e7cdb	DJ para Evento 4 Horas	dj-evento-4h	DJ profesional con equipo de sonido e iluminación para fiestas y eventos corporativos	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	\N	FIXED	150000	GTQ	240	240	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4	e41eae36-88fb-43f1-aced-9b299c0e7cdb	DJ para Boda	dj-boda	DJ profesional para ceremonia, recepción y animación, 8 horas completas	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	\N	FIXED	350000	GTQ	480	480	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5	0d9a4762-c6e7-42c6-a5b2-7311b319c191	Tatuaje Pequeño	tatuaje-pequeno	Tatuaje personalizado pequeño (hasta 5x5cm), diseño incluido y consulta gratuita	cccccccc-cccc-cccc-cccc-cccccccccccc	\N	FIXED	30000	GTQ	60	60	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6	0d9a4762-c6e7-42c6-a5b2-7311b319c191	Tatuaje Mediano	tatuaje-mediano	Tatuaje personalizado mediano (hasta 15x15cm), diseño profesional incluido	cccccccc-cccc-cccc-cccc-cccccccccccc	\N	FIXED	100000	GTQ	180	180	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
\.



\unrestrict hK1e7FN5abA9Tkqbg9xgd6kSSIiZbQiA7MTh7Ao6B0IMrUq2NfyLtfhuNCgwrEB


-- Reservas
a4dc01c0-95f6-4fbd-92e2-926ec8a01f4a	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1	2026-04-05 16:12:01.113	120	\N	\N	\N	\N	COMPLETED	75000	0	75000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-05 16:12:01.113	2026-04-05 16:12:01.113
d7059c41-42af-4731-972c-6a579c12adcc	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3	2026-04-27 16:12:01.113	240	\N	\N	\N	\N	PENDING	150000	0	150000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:12:01.113	2026-04-20 16:12:01.113
7df3a413-ee86-486c-a369-a84b4ec43860	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5	2026-04-23 16:12:01.113	60	\N	\N	\N	\N	CONFIRMED	30000	0	30000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:12:01.113	2026-04-20 16:12:01.113
90086f41-7aca-462b-a205-6c9d10f287f7	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-05-20 16:12:01.113	480	\N	\N	\N	\N	REJECTED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:12:01.113	2026-04-20 16:12:01.113
9168b757-3803-418a-890d-46a3c2a3d5d3	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4	2026-04-12 16:12:01.113	480	\N	\N	\N	\N	COMPLETED	350000	0	350000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-12 16:12:01.113	2026-04-12 16:12:01.113
4ea4bc37-60af-41f9-8c03-f2f6bf884eb2	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6	2026-03-26 16:12:01.113	180	\N	\N	\N	\N	CANCELLED_CLIENT	100000	0	100000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-03-26 16:12:01.113	2026-03-26 16:12:01.113
ee19e336-0339-4952-9cfe-e4f5e3ac5583	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-06-04 16:12:01.113	480	\N	\N	\N	\N	CONFIRMED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:12:01.113	2026-04-20 16:12:01.113
2928b8dd-f1d3-4f54-a26f-d7ce15bd01c3	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1	2026-04-05 16:13:18.05	120	\N	\N	\N	\N	COMPLETED	75000	0	75000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-05 16:13:18.05	2026-04-05 16:13:18.05
28355f3a-a591-4661-9643-1669d7b20067	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3	2026-04-27 16:13:18.05	240	\N	\N	\N	\N	PENDING	150000	0	150000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:13:18.05	2026-04-20 16:13:18.05
ae4d10fb-068d-4929-8184-ecefed7decef	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5	2026-04-23 16:13:18.05	60	\N	\N	\N	\N	CONFIRMED	30000	0	30000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:13:18.05	2026-04-20 16:13:18.05
f9a4a255-0415-47f4-b754-24ef992ee257	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-05-20 16:13:18.05	480	\N	\N	\N	\N	REJECTED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:13:18.05	2026-04-20 16:13:18.05
ddb5e6b0-828d-48da-8b4c-691ebbce0e83	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4	2026-04-12 16:13:18.05	480	\N	\N	\N	\N	COMPLETED	350000	0	350000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-12 16:13:18.05	2026-04-12 16:13:18.05
c556bf01-873c-47a1-ba06-c7d8d5206c54	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6	2026-03-26 16:13:18.05	180	\N	\N	\N	\N	CANCELLED_CLIENT	100000	0	100000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-03-26 16:13:18.05	2026-03-26 16:13:18.05
b543da32-6848-4a6a-b6c8-9eab42d1130c	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-06-04 16:13:18.05	480	\N	\N	\N	\N	CONFIRMED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:13:18.05	2026-04-20 16:13:18.05
\.



\unrestrict IA1GBZB7nsY06KwOP2CGAtLj69gMCLozs5g0DsqajOEa3jjxYrgjcqQ08ebczQF


-- Conversaciones y Mensajes
c1835568-b110-44e1-8311-6b92ca9b3475	99a58dcf-3916-4a9c-b3da-1329d58d7206	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Perfecto, me encanta. Hagamos una sesión de prueba	\N	SENT	\N	2026-04-17 16:12:01.185	\N	\N	2026-04-17 16:12:01.185	2026-04-17 16:12:01.185
61bf5b82-202a-4be5-882c-ece25899169f	f0680d59-90a0-47bf-880c-1bd7aa68b20d	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Hola Claudia, necesito DJ para una fiesta el próximo mes	\N	SENT	\N	2026-04-15 16:12:01.185	\N	\N	2026-04-15 16:12:01.185	2026-04-15 16:12:01.185
b1807d4e-0ecc-4e66-a4a8-97eea0119be4	f0680d59-90a0-47bf-880c-1bd7aa68b20d	e41eae36-88fb-43f1-aced-9b299c0e7cdb	TEXT	Perfecto, tengo disponibilidad. ¿Qué tipo de música prefieres?	\N	SENT	\N	2026-04-16 04:12:01.185	\N	\N	2026-04-16 04:12:01.185	2026-04-16 04:12:01.185
7f22e05a-b4cf-42fd-a952-ed5f834f42b1	f0680d59-90a0-47bf-880c-1bd7aa68b20d	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Pop, reggaeton y un poco de electrónica	\N	SENT	\N	2026-04-17 16:12:01.185	\N	\N	2026-04-17 16:12:01.185	2026-04-17 16:12:01.185
904f6c2e-35e1-4dbd-b422-a83e35a6eeca	f0680d59-90a0-47bf-880c-1bd7aa68b20d	e41eae36-88fb-43f1-aced-9b299c0e7cdb	TEXT	Excelente, eso puedo hacerlo sin problema	\N	SENT	\N	2026-04-19 16:12:01.185	\N	\N	2026-04-19 16:12:01.185	2026-04-19 16:12:01.185
8da85d56-0020-45a4-9f67-f2d45c446a1e	1fb777ef-50d8-413a-9da4-cc817bce1254	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Hola Diego, quiero un tatuaje personalizado	\N	SENT	\N	2026-04-14 16:12:01.185	\N	\N	2026-04-14 16:12:01.185	2026-04-14 16:12:01.185
de4ff07d-e020-462f-a600-f030b601eac0	1fb777ef-50d8-413a-9da4-cc817bce1254	0d9a4762-c6e7-42c6-a5b2-7311b319c191	TEXT	Claro, ¿qué tienes en mente?	\N	SENT	\N	2026-04-15 04:12:01.185	\N	\N	2026-04-15 04:12:01.185	2026-04-15 04:12:01.185
b64ca9a5-a257-439c-b905-01fd8f4bb69d	1fb777ef-50d8-413a-9da4-cc817bce1254	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Un mandala pequeño con símbolos espirituales	\N	SENT	\N	2026-04-15 16:12:01.185	\N	\N	2026-04-15 16:12:01.185	2026-04-15 16:12:01.185
3bf14038-40e7-438c-bc6e-64ac73654079	1fb777ef-50d8-413a-9da4-cc817bce1254	0d9a4762-c6e7-42c6-a5b2-7311b319c191	TEXT	Perfecto, tengo varios diseños de mandalas	\N	SENT	\N	2026-04-16 16:12:01.185	\N	\N	2026-04-16 16:12:01.185	2026-04-16 16:12:01.185
74d61d54-3d5a-4cfe-af21-5f41e84dd34a	1fb777ef-50d8-413a-9da4-cc817bce1254	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Genial, podemos agendar pronto	\N	SENT	\N	2026-04-18 16:12:01.185	\N	\N	2026-04-18 16:12:01.185	2026-04-18 16:12:01.185
c0874da5-f5cf-4323-b991-75472797970e	41fbbb64-55d5-4b7a-bd7f-33e8e966b0c2	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Hola Rob, me interesa tu sesión fotográfica para una boda	\N	SENT	\N	2026-04-13 16:13:18.132	\N	\N	2026-04-13 16:13:18.132	2026-04-13 16:13:18.132
d5e7ee19-e8cf-44b7-a845-8546ad36981b	41fbbb64-55d5-4b7a-bd7f-33e8e966b0c2	5e83275d-661e-4f51-b011-ff859299dd53	TEXT	¡Hola! Claro, tengo disponibilidad el próximo mes	\N	SENT	\N	2026-04-14 04:13:18.132	\N	\N	2026-04-14 04:13:18.132	2026-04-14 04:13:18.132
eee31c00-e46b-4dbc-9454-0edd37330bf6	41fbbb64-55d5-4b7a-bd7f-33e8e966b0c2	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	¿Cuál es tu estilo? ¿Haces fotos creativas?	\N	SENT	\N	2026-04-14 16:13:18.132	\N	\N	2026-04-14 16:13:18.132	2026-04-14 16:13:18.132
f64cba94-88d1-40f7-8ea9-93157938dc84	41fbbb64-55d5-4b7a-bd7f-33e8e966b0c2	5e83275d-661e-4f51-b011-ff859299dd53	TEXT	Sí, me especializo en fotos artísticas y naturales	\N	SENT	\N	2026-04-15 04:13:18.132	\N	\N	2026-04-15 04:13:18.132	2026-04-15 04:13:18.132
b07827e2-38dc-4c2a-83a1-4d4cce194e5a	41fbbb64-55d5-4b7a-bd7f-33e8e966b0c2	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Perfecto, me encanta. Hagamos una sesión de prueba	\N	SENT	\N	2026-04-17 16:13:18.132	\N	\N	2026-04-17 16:13:18.132	2026-04-17 16:13:18.132
13faa53a-d838-47f1-86bb-f40a1e951bb3	268f208c-3ff0-49e7-9e5b-f70993c0a1f9	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Hola Claudia, necesito DJ para una fiesta el próximo mes	\N	SENT	\N	2026-04-15 16:13:18.132	\N	\N	2026-04-15 16:13:18.132	2026-04-15 16:13:18.132
c54db0df-c473-4c99-963e-c07987152650	268f208c-3ff0-49e7-9e5b-f70993c0a1f9	e41eae36-88fb-43f1-aced-9b299c0e7cdb	TEXT	Perfecto, tengo disponibilidad. ¿Qué tipo de música prefieres?	\N	SENT	\N	2026-04-16 04:13:18.132	\N	\N	2026-04-16 04:13:18.132	2026-04-16 04:13:18.132
05d41d91-32bb-4f1b-9b13-de15bd0e758a	268f208c-3ff0-49e7-9e5b-f70993c0a1f9	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Pop, reggaeton y un poco de electrónica	\N	SENT	\N	2026-04-17 16:13:18.132	\N	\N	2026-04-17 16:13:18.132	2026-04-17 16:13:18.132
8fcec1ee-5cc0-4070-af9d-6e49a364316d	268f208c-3ff0-49e7-9e5b-f70993c0a1f9	e41eae36-88fb-43f1-aced-9b299c0e7cdb	TEXT	Excelente, eso puedo hacerlo sin problema	\N	SENT	\N	2026-04-19 16:13:18.132	\N	\N	2026-04-19 16:13:18.132	2026-04-19 16:13:18.132
0043e465-dadc-4dec-bc67-e6cd30f6fb07	009b258a-8fb4-49d4-90da-4fe03a000fe6	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Hola Diego, quiero un tatuaje personalizado	\N	SENT	\N	2026-04-14 16:13:18.132	\N	\N	2026-04-14 16:13:18.132	2026-04-14 16:13:18.132
70b9d4cd-4036-4835-8b94-0d4ab961bd14	009b258a-8fb4-49d4-90da-4fe03a000fe6	0d9a4762-c6e7-42c6-a5b2-7311b319c191	TEXT	Claro, ¿qué tienes en mente?	\N	SENT	\N	2026-04-15 04:13:18.132	\N	\N	2026-04-15 04:13:18.132	2026-04-15 04:13:18.132
dc75d332-2e1a-4150-987e-d1a72eee8815	009b258a-8fb4-49d4-90da-4fe03a000fe6	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Un mandala pequeño con símbolos espirituales	\N	SENT	\N	2026-04-15 16:13:18.132	\N	\N	2026-04-15 16:13:18.132	2026-04-15 16:13:18.132
fb20edae-ba35-4750-988f-09960cf6fc3c	009b258a-8fb4-49d4-90da-4fe03a000fe6	0d9a4762-c6e7-42c6-a5b2-7311b319c191	TEXT	Perfecto, tengo varios diseños de mandalas	\N	SENT	\N	2026-04-16 16:13:18.132	\N	\N	2026-04-16 16:13:18.132	2026-04-16 16:13:18.132
68c66b14-b9bf-48f6-8dd4-44af6c14db76	009b258a-8fb4-49d4-90da-4fe03a000fe6	fe3e467b-2a1e-46e6-a36b-e961f391aed0	TEXT	Genial, podemos agendar pronto	\N	SENT	\N	2026-04-18 16:13:18.132	\N	\N	2026-04-18 16:13:18.132	2026-04-18 16:13:18.132
\.



\unrestrict W37LWFE3MUFiy2h5BU4wiXRZfiIcp9fAOdbutrHeR7yVJxBVcs0ueqrGAu9DHUQ


-- Reviews

\restrict dVWEt7t1xpn4e0cWl37ZbnAGla0YFq5nfeQsEn3oQ54WINs4wSZKLoix5tY1ZM8


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COPY public.reviews (id, "bookingId", "clientId", "artistId", "serviceId", rating, comment, status, "helpfulCount", "notHelpfulCount", "isVerified", "deletedAt", "createdAt", "updatedAt") FROM stdin;
4261c151-2c5b-4ed0-b90d-b840c8d498c9	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas y la presentación del álbum fue impecable.	APPROVED	0	0	t	\N	2026-04-06 16:06:10.974	2026-04-06 16:06:10.974
569e6c03-d0e0-412a-ba28-dc508e396079	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde. La música fue excelente una vez comenzó.	APPROVED	0	0	t	\N	2026-04-13 16:06:10.974	2026-04-13 16:06:10.974
0d5351c4-6deb-4be8-9dc3-9a44552ae292	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. El tatuaje quedó exactamente como lo imaginé. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:06:10.974	2026-04-18 16:06:10.974
d970a682-d6e1-4324-8b1e-18f987bbba39	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas y la presentación del álbum fue impecable.	APPROVED	0	0	t	\N	2026-04-06 16:07:14.948	2026-04-06 16:07:14.948
3c6000da-35e5-4a0a-bfab-21fbac415a38	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde. La música fue excelente una vez comenzó.	APPROVED	0	0	t	\N	2026-04-13 16:07:14.948	2026-04-13 16:07:14.948
f5503dea-4581-4fad-9d49-57c94632b06f	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. El tatuaje quedó exactamente como lo imaginé. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:07:14.948	2026-04-18 16:07:14.948
8c7a0885-e7f0-4ee4-b591-5152aaa767cb	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas y la presentación del álbum fue impecable.	APPROVED	0	0	t	\N	2026-04-06 16:07:33.918	2026-04-06 16:07:33.918
a7aa21e8-cfe5-482a-83d0-625f6ba30153	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde. La música fue excelente una vez comenzó.	APPROVED	0	0	t	\N	2026-04-13 16:07:33.918	2026-04-13 16:07:33.918
3c2af691-0536-4121-b3ba-65e5adcd4fe2	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. El tatuaje quedó exactamente como lo imaginé. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:07:33.918	2026-04-18 16:07:33.918
ce54385b-51c4-4219-b2a8-875445b3322b	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas y la presentación del álbum fue impecable.	APPROVED	0	0	t	\N	2026-04-06 16:10:07.185	2026-04-06 16:10:07.185
42d20353-71cc-4b0d-8ba0-1da59ccf592b	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde. La música fue excelente una vez comenzó.	APPROVED	0	0	t	\N	2026-04-13 16:10:07.185	2026-04-13 16:10:07.185
49aa58ce-958c-44f7-871e-bf5f30a5361c	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. El tatuaje quedó exactamente como lo imaginé. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:10:07.185	2026-04-18 16:10:07.185
5f37a053-ef11-4806-9c7c-b46118b12adc	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas	APPROVED	0	0	t	\N	2026-04-06 16:12:01.255	2026-04-06 16:12:01.255
773a0241-927d-4307-90f0-1cb6bbe81cdd	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde	APPROVED	0	0	t	\N	2026-04-13 16:12:01.255	2026-04-13 16:12:01.255
776a066c-875b-4142-b0cb-47630b99c2d4	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:12:01.255	2026-04-18 16:12:01.255
a32c7952-656e-441a-81a7-90aa595e6432	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	\N	5	Excelente trabajo profesional. Las fotos quedaron hermosas	APPROVED	0	0	t	\N	2026-04-06 16:13:18.205	2026-04-06 16:13:18.205
b9a357ed-4dca-4a38-a1e8-db6873ddd3e8	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	\N	3	Buen servicio pero llegó 30 minutos tarde	APPROVED	0	0	t	\N	2026-04-13 16:13:18.205	2026-04-13 16:13:18.205
3a8e24c6-468f-4d03-a218-60487b6cbdf3	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	\N	4	Muy profesional y creativo. Recomendado!	APPROVED	0	0	t	\N	2026-04-18 16:13:18.205	2026-04-18 16:13:18.205
\.



\unrestrict dVWEt7t1xpn4e0cWl37ZbnAGla0YFq5nfeQsEn3oQ54WINs4wSZKLoix5tY1ZM8

