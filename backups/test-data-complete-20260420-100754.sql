-- ============================================================================
-- BACKUP: Escenario Completo de Prueba
-- Cliente: client01@piums.com
-- Artistas: Rob Photography, Claudia Eventos, Diego Ink
-- Contiene: 6 servicios, 7 reservas, 9 reviews
-- Fecha: Mon Apr 20 10:07:54 CST 2026
-- ============================================================================

--
-- PostgreSQL database dump
--

\restrict 712yaxbK7ae5PymDV43qxAvoMkTzUfBXXjTDQyqQXTQY0rf4YvYht1ILRckSDCl

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_categories (id, name, slug, description, icon, image, "parentId", level, path, "order", "isActive", "isFeatured", "metaTitle", "metaDescription", keywords, "serviceCount", "primaryColor", "secondaryColor", "createdAt", "updatedAt") FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Fotografía	fotografia	Servicios de fotografía profesional	camera	\N	\N	0	\N	1	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	DJ y Música	dj-musica	Servicios de DJ y entretenimiento musical	music	\N	\N	0	\N	2	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
cccccccc-cccc-cccc-cccc-cccccccccccc	Tatuajes	tatuajes	Servicios de tatuaje profesional	pen	\N	\N	0	\N	3	t	f	\N	\N	\N	0	\N	\N	2026-04-20 16:06:10.772	2026-04-20 16:06:10.772
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.services (id, "artistId", name, slug, description, "categoryId", "cityId", "pricingType", "basePrice", currency, "durationMin", "durationMax", images, thumbnail, status, "isAvailable", "isFeatured", "whatIsIncluded", "requiresDeposit", "depositAmount", "depositPercentage", "requiresConsultation", "cancellationPolicy", "termsAndConditions", tags, "isMainService", "minGuests", "maxGuests", "viewCount", "bookingCount", "createdAt", "updatedAt") FROM stdin;
f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1	5e83275d-661e-4f51-b011-ff859299dd53	Sesión Fotográfica 2 Horas	sesion-foto-2h	Sesión de fotos profesional, incluye 50-100 fotos editadas con garantía de calidad	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	\N	FIXED	75000	GTQ	120	120	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	5e83275d-661e-4f51-b011-ff859299dd53	Cobertura de Boda Completa	boda-completa	Cobertura de 8 horas de boda, 300+ fotos editadas, álbum digital premium incluido	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	\N	FIXED	250000	GTQ	480	480	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3	e41eae36-88fb-43f1-aced-9b299c0e7cdb	DJ para Evento 4 Horas	dj-evento-4h	DJ profesional con equipo de sonido e iluminación para fiestas y eventos corporativos	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	\N	FIXED	150000	GTQ	240	240	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4	e41eae36-88fb-43f1-aced-9b299c0e7cdb	DJ para Boda	dj-boda	DJ profesional para ceremonia, recepción y animación, 8 horas completas	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	\N	FIXED	350000	GTQ	480	480	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5	0d9a4762-c6e7-42c6-a5b2-7311b319c191	Tatuaje Pequeño	tatuaje-pequeno	Tatuaje personalizado pequeño (hasta 5x5cm), diseño incluido y consulta gratuita	cccccccc-cccc-cccc-cccc-cccccccccccc	\N	FIXED	30000	GTQ	60	60	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6	0d9a4762-c6e7-42c6-a5b2-7311b319c191	Tatuaje Mediano	tatuaje-mediano	Tatuaje personalizado mediano (hasta 15x15cm), diseño profesional incluido	cccccccc-cccc-cccc-cccc-cccccccccccc	\N	FIXED	100000	GTQ	180	180	\N	\N	ACTIVE	t	f	\N	t	\N	50	f	\N	\N	\N	f	\N	\N	0	0	2026-04-20 16:06:10.846	2026-04-20 16:06:10.846
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 712yaxbK7ae5PymDV43qxAvoMkTzUfBXXjTDQyqQXTQY0rf4YvYht1ILRckSDCl


--
-- PostgreSQL database dump
--

\restrict 8EUrml8WTqQeK4GegfmR8jFwXsb1gxidqYu53BtjoUsihFZzI5eTi3sy6mZYjd6

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.bookings (id, code, "clientId", "artistId", "serviceId", "scheduledDate", "durationMinutes", location, "locationLat", "locationLng", "cityId", status, "servicePrice", "addonsPrice", "totalPrice", currency, "quoteSnapshot", "depositRequired", "depositAmount", "depositPaidAt", "paymentStatus", "paymentIntentId", "paymentId", "paidAmount", "paidAt", "paymentMethod", "selectedAddons", "clientNotes", "artistNotes", "internalNotes", "cancelledAt", "cancelledBy", "cancellationReason", "refundAmount", "rescheduledAt", "rescheduledBy", "rescheduleReason", "rescheduleCount", "confirmedAt", "confirmedBy", "reminderSent24h", "reminderSent2h", "reviewId", "eventId", "deletedAt", "createdAt", "updatedAt") FROM stdin;
810bfab3-27d2-4b95-bb73-bff24f01af72	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1	2026-04-05 16:07:33.845	120	\N	\N	\N	\N	COMPLETED	75000	0	75000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-05 16:07:33.845	2026-04-05 16:07:33.845
7bb45eb0-0e7b-4880-bb93-3674752f97a6	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3	2026-04-27 16:07:33.845	240	\N	\N	\N	\N	PENDING	150000	0	150000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:07:33.845	2026-04-20 16:07:33.845
65f8c0fe-e5bf-4f51-977e-e5359928f96a	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5	2026-04-23 16:07:33.845	60	\N	\N	\N	\N	CONFIRMED	30000	0	30000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:07:33.845	2026-04-20 16:07:33.845
aee7743d-cf4f-48ee-ac2c-0e722996d8f6	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-05-20 16:07:33.845	480	\N	\N	\N	\N	REJECTED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:07:33.845	2026-04-20 16:07:33.845
5417c1a5-1c2e-419f-95ee-57e6d4147cb5	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	e41eae36-88fb-43f1-aced-9b299c0e7cdb	f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4	2026-04-12 16:07:33.845	480	\N	\N	\N	\N	COMPLETED	350000	0	350000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-12 16:07:33.845	2026-04-12 16:07:33.845
9c7f3938-f485-4e51-ad5a-e890c64ff201	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	0d9a4762-c6e7-42c6-a5b2-7311b319c191	f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6	2026-03-26 16:07:33.845	180	\N	\N	\N	\N	CANCELLED_CLIENT	100000	0	100000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-03-26 16:07:33.845	2026-03-26 16:07:33.845
1e184d39-93bf-45f4-a87c-5b43a00fa447	\N	fe3e467b-2a1e-46e6-a36b-e961f391aed0	5e83275d-661e-4f51-b011-ff859299dd53	f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2	2026-06-04 16:07:33.845	480	\N	\N	\N	\N	CONFIRMED	250000	0	250000	GTQ	\N	f	\N	\N	PENDING	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	f	f	\N	\N	\N	2026-04-20 16:07:33.845	2026-04-20 16:07:33.845
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 8EUrml8WTqQeK4GegfmR8jFwXsb1gxidqYu53BtjoUsihFZzI5eTi3sy6mZYjd6


--
-- PostgreSQL database dump
--

\restrict tzsTtulcRqROqu2VAFGqYBLZJLVu95tb0FO9SSGvdcIagwv045SVslqrfLay6Vi

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: piums
--

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
\.


--
-- PostgreSQL database dump complete
--

\unrestrict tzsTtulcRqROqu2VAFGqYBLZJLVu95tb0FO9SSGvdcIagwv045SVslqrfLay6Vi

