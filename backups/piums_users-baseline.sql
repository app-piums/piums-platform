--
-- PostgreSQL database dump
--

\restrict zFfMTMV5dhHuL74OIGQG7MQvq4Nvgz20tqW6rZjzdwtck9foMkLbBRDZlhtMrh3

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
-- Name: ConversationStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ConversationStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'BLOCKED'
);


ALTER TYPE public."ConversationStatus" OWNER TO piums;

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ConversationType" AS ENUM (
    'DIRECT',
    'BOOKING_RELATED',
    'SUPPORT'
);


ALTER TYPE public."ConversationType" OWNER TO piums;

--
-- Name: FavoriteEntityType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."FavoriteEntityType" AS ENUM (
    'ARTIST',
    'SERVICE',
    'PACKAGE'
);


ALTER TYPE public."FavoriteEntityType" OWNER TO piums;

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED'
);


ALTER TYPE public."MessageStatus" OWNER TO piums;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'BOOKING_REQUEST',
    'BOOKING_UPDATE',
    'SYSTEM'
);


ALTER TYPE public."MessageType" OWNER TO piums;

--
-- Name: ProfileType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ProfileType" AS ENUM (
    'USER',
    'ARTIST',
    'BOTH'
);


ALTER TYPE public."ProfileType" OWNER TO piums;

--
-- Name: ProfileVisibility; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ProfileVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'HIDDEN'
);


ALTER TYPE public."ProfileVisibility" OWNER TO piums;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text NOT NULL,
    "zipCode" text NOT NULL,
    lat double precision,
    lng double precision,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.addresses OWNER TO piums;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    "participant1Id" text NOT NULL,
    "participant2Id" text NOT NULL,
    type public."ConversationType" DEFAULT 'DIRECT'::public."ConversationType" NOT NULL,
    "bookingId" text,
    status public."ConversationStatus" DEFAULT 'ACTIVE'::public."ConversationStatus" NOT NULL,
    "lastMessageAt" timestamp(3) without time zone,
    "lastMessagePreview" text,
    "unreadCountP1" integer DEFAULT 0 NOT NULL,
    "unreadCountP2" integer DEFAULT 0 NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO piums;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.favorites (
    id text NOT NULL,
    "userId" text NOT NULL,
    "entityType" public."FavoriteEntityType" NOT NULL,
    "entityId" text NOT NULL,
    notes text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.favorites OWNER TO piums;

--
-- Name: follows; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.follows (
    id text NOT NULL,
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "notifyNewServices" boolean DEFAULT true NOT NULL,
    "notifySpecialOffers" boolean DEFAULT true NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.follows OWNER TO piums;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    type public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    content text NOT NULL,
    attachments jsonb,
    status public."MessageStatus" DEFAULT 'SENT'::public."MessageStatus" NOT NULL,
    "readAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "replyToId" text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO piums;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "artistId" text,
    "displayName" text NOT NULL,
    slug text NOT NULL,
    avatar text,
    "coverPhoto" text,
    bio text,
    tagline text,
    "profileType" public."ProfileType" DEFAULT 'USER'::public."ProfileType" NOT NULL,
    visibility public."ProfileVisibility" DEFAULT 'PUBLIC'::public."ProfileVisibility" NOT NULL,
    city text,
    "cityId" text,
    state text,
    country text,
    website text,
    instagram text,
    facebook text,
    twitter text,
    linkedin text,
    youtube text,
    tiktok text,
    "followersCount" integer DEFAULT 0 NOT NULL,
    "followingCount" integer DEFAULT 0 NOT NULL,
    "totalBookings" integer DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "averageRating" double precision DEFAULT 0.0 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verificationBadge" text,
    keywords text[],
    categories text[],
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "lastActive" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.profiles OWNER TO piums;

--
-- Name: users; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.users (
    id text NOT NULL,
    "authId" text NOT NULL,
    email text NOT NULL,
    nombre text NOT NULL,
    avatar text,
    bio text,
    telefono text,
    pais text,
    language text DEFAULT 'es'::text NOT NULL,
    timezone text DEFAULT 'America/Mexico_City'::text NOT NULL,
    "notificationsEnabled" boolean DEFAULT true NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "smsNotifications" boolean DEFAULT false NOT NULL,
    "pushNotifications" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "lastLoginAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO piums;

--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.addresses (id, "userId", label, street, city, state, country, "zipCode", lat, lng, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.conversations (id, "participant1Id", "participant2Id", type, "bookingId", status, "lastMessageAt", "lastMessagePreview", "unreadCountP1", "unreadCountP2", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.favorites (id, "userId", "entityType", "entityId", notes, "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.follows (id, "followerId", "followingId", "notifyNewServices", "notifySpecialOffers", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.messages (id, "conversationId", "senderId", type, content, attachments, status, "readAt", "deliveredAt", "replyToId", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.profiles (id, "userId", "artistId", "displayName", slug, avatar, "coverPhoto", bio, tagline, "profileType", visibility, city, "cityId", state, country, website, instagram, facebook, twitter, linkedin, youtube, tiktok, "followersCount", "followingCount", "totalBookings", "totalReviews", "averageRating", "isVerified", "verifiedAt", "verificationBadge", keywords, categories, "isFeatured", "isPremium", "viewCount", "lastActive", "createdAt", "updatedAt") FROM stdin;
d0eacd6b-331d-4915-86a5-f05d1e0102a3	0e83e731-22f5-48b1-881d-c4a259b4c6c5	\N	Ana Cifuentes	ana-cifuentes-fe3e467b	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.303	2026-04-20 15:42:38.303
40489383-a7c6-4a10-8ae9-6308ff2343d6	8d333bfa-f43c-4b7b-9dbf-e68f4d7c2658	\N	Carlos Rodríguez	carlos-rodriguez-8d320158	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.325	2026-04-20 15:42:38.325
e29aab5b-269a-49e3-82de-ce7170cc127a	08bf8498-546f-4fb8-917b-7f7e6431cbeb	\N	Lucía Herrera	lucia-herrera-762ab74c	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.406	2026-04-20 15:42:38.406
152521f3-a544-451f-ab7a-7bc1087e338d	a0b44866-87d0-40ef-b0dc-b47d92786743	\N	Fernando López	fernando-lopez-f59b74b2	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.488	2026-04-20 15:42:38.488
dc537f82-92dc-4c51-9cc3-1d20d9cb9ae3	7c3b7da8-d5ad-4c1a-a8fc-0182f432cee3	\N	Gabriela Morales	gabriela-morales-6ee9b6da	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.571	2026-04-20 15:42:38.571
26a97984-aedd-47cf-9863-b2941f1430c4	606b8b2c-8dc6-400d-86db-da5de915168a	\N	Mario Ajú	mario-aju-624c9927	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.655	2026-04-20 15:42:38.655
100e7c16-c855-4b97-98a4-a4cd60f06167	a0bfb2f8-a208-45be-9771-5e4836634f05	\N	Stefanie Vega	stefanie-vega-c18ed417	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.747	2026-04-20 15:42:38.747
0489b32c-e822-443e-9fc6-6dfe51823acc	2502b066-62e6-4ceb-b5c7-93d0408ff691	\N	Rodrigo Pérez	rodrigo-perez-c2e29702	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.834	2026-04-20 15:42:38.834
ca2e6543-3d04-436f-819b-d1ae8bbb0a53	02dc84e7-a254-4dad-ad62-b0b9d3d64d34	\N	Valeria Torres	valeria-torres-f44b0d87	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:38.916	2026-04-20 15:42:38.916
77b119b0-288c-4996-adfe-b281a8c76ed2	d631ffbf-1e58-4b63-ab48-1e0faa98321d	\N	Diego Fuentes	diego-fuentes-ad7dfab0	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.002	2026-04-20 15:42:39.002
0fb1df0d-278b-47dc-8190-7940ce88189b	d8780af1-0756-434f-b84e-aa525961c68f	\N	María González	maria-gonzalez-566431b0	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.089	2026-04-20 15:42:39.089
d8081123-74ee-4af7-93ef-3d0c4a7b3687	1f71a514-69c3-4bd7-a9d4-b6e3e61b4f85	\N	Roberto Pérez	roberto-perez-832b8f02	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.258	2026-04-20 15:42:39.258
ce96f828-d97f-4a88-8552-9b77a40a333b	9d96f9c2-7c4b-47d2-8df7-0798bd0dd62d	\N	Alejandro Díaz	alejandro-diaz-0feb9f97	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.377	2026-04-20 15:42:39.377
7fef260e-c6f7-4ca9-ade6-4177151ceeea	92efd575-d93c-44ec-a8e6-406988a5fb0b	\N	Sofía Morales	sofia-morales-68d1b57a	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.5	2026-04-20 15:42:39.5
2de2a2d2-b0df-4d71-ad95-a4bdc6aa7584	a56a7e5d-fd6c-4a02-a9f8-bb5953a3876a	\N	Diego Castro	diego-castro-98f1d79a	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.656	2026-04-20 15:42:39.656
8060cc68-ff4c-4e93-9e8b-ea67400e2466	ac19f8da-cca9-4515-886e-c65a65067b37	\N	Paola Ajú	paola-aju-7cb420a8	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.78	2026-04-20 15:42:39.78
1d64404c-791f-413f-bab8-5de415af1882	bb3395ae-7be7-49f6-91a0-6a7440fa3ecc	\N	Humberto Ruiz	humberto-ruiz-5a9ce727	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.891	2026-04-20 15:42:39.891
5f79cbd0-79bf-41cf-af23-8f8c1d16d929	ff4fc4c5-3b44-4752-80e2-afc36f273465	\N	Claudia Chávez	claudia-chavez-f5e19019	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:39.999	2026-04-20 15:42:39.999
cc39d9ce-293d-43fd-9b32-d0921d6482c5	f56d8850-8f80-4eed-a0c8-28a8ced0cc1e	\N	Samuel Tzul	samuel-tzul-c84105fb	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:40.099	2026-04-20 15:42:40.099
e8f87b2b-7757-4c68-8115-10e8c4b7e257	6766012f-ddd6-45dc-9f52-e33a3edc5f8b	\N	Renata Morán	renata-moran-ccdf2fe7	\N	\N	\N	\N	USER	PUBLIC	\N	\N	\N	Guatemala	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	f	\N	\N	{}	{}	f	f	0	\N	2026-04-20 15:42:40.209	2026-04-20 15:42:40.209
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.users (id, "authId", email, nombre, avatar, bio, telefono, pais, language, timezone, "notificationsEnabled", "emailNotifications", "smsNotifications", "pushNotifications", "createdAt", "updatedAt", "deletedAt", "lastLoginAt") FROM stdin;
0e83e731-22f5-48b1-881d-c4a259b4c6c5	fe3e467b-2a1e-46e6-a36b-e961f391aed0	client01@piums.com	Ana Cifuentes	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.296	2026-04-20 15:42:38.296	\N	2026-04-20 15:42:38.295
8d333bfa-f43c-4b7b-9dbf-e68f4d7c2658	8d320158-ce66-4067-b978-337a75b05071	client02@piums.com	Carlos Rodríguez	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.321	2026-04-20 15:42:38.321	\N	2026-04-20 15:42:38.32
08bf8498-546f-4fb8-917b-7f7e6431cbeb	762ab74c-b7b4-4f9d-8204-05fb40df7ec6	client03@piums.com	Lucía Herrera	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.404	2026-04-20 15:42:38.404	\N	2026-04-20 15:42:38.403
a0b44866-87d0-40ef-b0dc-b47d92786743	f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	client04@piums.com	Fernando López	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.486	2026-04-20 15:42:38.486	\N	2026-04-20 15:42:38.485
7c3b7da8-d5ad-4c1a-a8fc-0182f432cee3	6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	client05@piums.com	Gabriela Morales	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.569	2026-04-20 15:42:38.569	\N	2026-04-20 15:42:38.568
606b8b2c-8dc6-400d-86db-da5de915168a	624c9927-2fb2-4e19-9078-5538bf62bcf0	client06@piums.com	Mario Ajú	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.652	2026-04-20 15:42:38.652	\N	2026-04-20 15:42:38.652
a0bfb2f8-a208-45be-9771-5e4836634f05	c18ed417-cba1-4216-bd3b-da4ff5439208	client07@piums.com	Stefanie Vega	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.744	2026-04-20 15:42:38.744	\N	2026-04-20 15:42:38.744
2502b066-62e6-4ceb-b5c7-93d0408ff691	c2e29702-b6d2-4824-ba85-758f783c2cdd	client08@piums.com	Rodrigo Pérez	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.832	2026-04-20 15:42:38.832	\N	2026-04-20 15:42:38.831
02dc84e7-a254-4dad-ad62-b0b9d3d64d34	f44b0d87-d9cd-4a31-bac4-e23150a940aa	client09@piums.com	Valeria Torres	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.914	2026-04-20 15:42:38.914	\N	2026-04-20 15:42:38.914
d631ffbf-1e58-4b63-ab48-1e0faa98321d	ad7dfab0-50f0-4b04-9b96-d952974e1b4c	client10@piums.com	Diego Fuentes	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:38.999	2026-04-20 15:42:38.999	\N	2026-04-20 15:42:38.999
d8780af1-0756-434f-b84e-aa525961c68f	566431b0-2d5d-46ae-ad6d-f6cf58b38979	artist01@piums.com	María González	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.086	2026-04-20 15:42:39.086	\N	2026-04-20 15:42:39.086
1f71a514-69c3-4bd7-a9d4-b6e3e61b4f85	832b8f02-fe80-4921-b322-5ceec5f8c256	artist02@piums.com	Roberto Pérez	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.256	2026-04-20 15:42:39.256	\N	2026-04-20 15:42:39.255
9d96f9c2-7c4b-47d2-8df7-0798bd0dd62d	0feb9f97-3a95-4931-b739-5fee9167bb85	artist03@piums.com	Alejandro Díaz	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.375	2026-04-20 15:42:39.375	\N	2026-04-20 15:42:39.374
92efd575-d93c-44ec-a8e6-406988a5fb0b	68d1b57a-97b8-436e-ab56-3cd621a10dc4	artist04@piums.com	Sofía Morales	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.496	2026-04-20 15:42:39.496	\N	2026-04-20 15:42:39.495
a56a7e5d-fd6c-4a02-a9f8-bb5953a3876a	98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	artist05@piums.com	Diego Castro	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.652	2026-04-20 15:42:39.652	\N	2026-04-20 15:42:39.651
ac19f8da-cca9-4515-886e-c65a65067b37	7cb420a8-33f6-481e-abcb-79321b782d92	artist06@piums.com	Paola Ajú	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.778	2026-04-20 15:42:39.778	\N	2026-04-20 15:42:39.778
bb3395ae-7be7-49f6-91a0-6a7440fa3ecc	5a9ce727-6e8e-44a7-bf72-07799033906f	artist07@piums.com	Humberto Ruiz	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.889	2026-04-20 15:42:39.889	\N	2026-04-20 15:42:39.888
ff4fc4c5-3b44-4752-80e2-afc36f273465	f5e19019-e70c-4c21-9f84-93f586eba254	artist08@piums.com	Claudia Chávez	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:39.997	2026-04-20 15:42:39.997	\N	2026-04-20 15:42:39.996
f56d8850-8f80-4eed-a0c8-28a8ced0cc1e	c84105fb-4bf5-4b00-9fca-ed8c9eae0103	artist09@piums.com	Samuel Tzul	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:40.096	2026-04-20 15:42:40.096	\N	2026-04-20 15:42:40.096
6766012f-ddd6-45dc-9f52-e33a3edc5f8b	ccdf2fe7-2ee8-471a-bf65-ee7c167db398	artist10@piums.com	Renata Morán	\N	\N	\N	Guatemala	es	America/Mexico_City	t	t	f	t	2026-04-20 15:42:40.207	2026-04-20 15:42:40.207	\N	2026-04-20 15:42:40.206
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: addresses_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "addresses_userId_idx" ON public.addresses USING btree ("userId");


--
-- Name: conversations_bookingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "conversations_bookingId_idx" ON public.conversations USING btree ("bookingId");


--
-- Name: conversations_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "conversations_lastMessageAt_idx" ON public.conversations USING btree ("lastMessageAt");


--
-- Name: conversations_participant1Id_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "conversations_participant1Id_idx" ON public.conversations USING btree ("participant1Id");


--
-- Name: conversations_participant1Id_participant2Id_bookingId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "conversations_participant1Id_participant2Id_bookingId_key" ON public.conversations USING btree ("participant1Id", "participant2Id", "bookingId");


--
-- Name: conversations_participant2Id_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "conversations_participant2Id_idx" ON public.conversations USING btree ("participant2Id");


--
-- Name: conversations_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX conversations_status_idx ON public.conversations USING btree (status);


--
-- Name: favorites_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "favorites_createdAt_idx" ON public.favorites USING btree ("createdAt");


--
-- Name: favorites_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "favorites_entityType_entityId_idx" ON public.favorites USING btree ("entityType", "entityId");


--
-- Name: favorites_userId_entityType_entityId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "favorites_userId_entityType_entityId_key" ON public.favorites USING btree ("userId", "entityType", "entityId");


--
-- Name: favorites_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "favorites_userId_idx" ON public.favorites USING btree ("userId");


--
-- Name: follows_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "follows_createdAt_idx" ON public.follows USING btree ("createdAt");


--
-- Name: follows_followerId_followingId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON public.follows USING btree ("followerId", "followingId");


--
-- Name: follows_followerId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "follows_followerId_idx" ON public.follows USING btree ("followerId");


--
-- Name: follows_followingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "follows_followingId_idx" ON public.follows USING btree ("followingId");


--
-- Name: messages_conversationId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "messages_conversationId_idx" ON public.messages USING btree ("conversationId");


--
-- Name: messages_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "messages_createdAt_idx" ON public.messages USING btree ("createdAt");


--
-- Name: messages_senderId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "messages_senderId_idx" ON public.messages USING btree ("senderId");


--
-- Name: messages_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX messages_status_idx ON public.messages USING btree (status);


--
-- Name: profiles_artistId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "profiles_artistId_key" ON public.profiles USING btree ("artistId");


--
-- Name: profiles_cityId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "profiles_cityId_idx" ON public.profiles USING btree ("cityId");


--
-- Name: profiles_city_country_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX profiles_city_country_idx ON public.profiles USING btree (city, country);


--
-- Name: profiles_isFeatured_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "profiles_isFeatured_idx" ON public.profiles USING btree ("isFeatured");


--
-- Name: profiles_isVerified_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "profiles_isVerified_idx" ON public.profiles USING btree ("isVerified");


--
-- Name: profiles_profileType_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "profiles_profileType_idx" ON public.profiles USING btree ("profileType");


--
-- Name: profiles_slug_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX profiles_slug_idx ON public.profiles USING btree (slug);


--
-- Name: profiles_slug_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX profiles_slug_key ON public.profiles USING btree (slug);


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: users_authId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "users_authId_idx" ON public.users USING btree ("authId");


--
-- Name: users_authId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "users_authId_key" ON public.users USING btree ("authId");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: favorites favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follows follows_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zFfMTMV5dhHuL74OIGQG7MQvq4Nvgz20tqW6rZjzdwtck9foMkLbBRDZlhtMrh3

