--
-- PostgreSQL database dump
--

\restrict ZoGczwzjVIf3LCIjIYLqm4mBgi3T89Hw2xuYduFPwsNk7g5F2noq5xFgt9zTvEB

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
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'REVOKED'
);


ALTER TYPE public."SessionStatus" OWNER TO piums;

--
-- Name: TokenStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."TokenStatus" AS ENUM (
    'PENDING',
    'USED',
    'EXPIRED',
    'REVOKED'
);


ALTER TYPE public."TokenStatus" OWNER TO piums;

--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."TokenType" AS ENUM (
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET',
    'TWO_FACTOR',
    'MAGIC_LINK'
);


ALTER TYPE public."TokenType" OWNER TO piums;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'BANNED',
    'PENDING_EMAIL'
);


ALTER TYPE public."UserStatus" OWNER TO piums;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text,
    "entityId" text,
    details jsonb,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO piums;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.email_verifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    email text NOT NULL,
    "tokenHash" text NOT NULL,
    status public."TokenStatus" DEFAULT 'PENDING'::public."TokenStatus" NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.email_verifications OWNER TO piums;

--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.password_resets (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    status public."TokenStatus" DEFAULT 'PENDING'::public."TokenStatus" NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.password_resets OWNER TO piums;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "deviceId" text,
    "isRevoked" boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    used boolean DEFAULT false NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO piums;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    jti text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "deviceId" text,
    "deviceName" text,
    status public."SessionStatus" DEFAULT 'ACTIVE'::public."SessionStatus" NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO piums;

--
-- Name: users; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "passwordHash" text,
    nombre text NOT NULL,
    name text,
    avatar text,
    provider text,
    "googleId" text,
    "facebookId" text,
    "tiktokId" text,
    role text DEFAULT 'user'::text NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING_EMAIL'::public."UserStatus" NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "backupCodes" text[],
    "lastLoginAt" timestamp(3) without time zone,
    "lastLoginIp" text,
    "onboardingCompletedAt" timestamp(3) without time zone,
    "lastPasswordChange" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    ciudad text,
    "birthDate" timestamp(3) without time zone,
    "documentType" text,
    "documentNumber" text,
    "documentFrontUrl" text,
    "documentBackUrl" text,
    "documentSelfieUrl" text,
    "rejectionReason" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO piums;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.audit_logs (id, "userId", action, entity, "entityId", details, success, "errorMessage", "ipAddress", "userAgent", "createdAt") FROM stdin;
4aae40e3-4beb-4093-8eaa-229afda30d05	fe3e467b-2a1e-46e6-a36b-e961f391aed0	USER_REGISTERED	User	fe3e467b-2a1e-46e6-a36b-e961f391aed0	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.223
2334422a-de88-48d3-8009-abedd08efdb2	8d320158-ce66-4067-b978-337a75b05071	USER_REGISTERED	User	8d320158-ce66-4067-b978-337a75b05071	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.321
e396fe2d-b6f6-4c75-836a-093fbfd058c2	762ab74c-b7b4-4f9d-8204-05fb40df7ec6	USER_REGISTERED	User	762ab74c-b7b4-4f9d-8204-05fb40df7ec6	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.404
9e9f8e12-a3bf-4e92-922a-4f79d975e0eb	f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	USER_REGISTERED	User	f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.486
52b7ec02-caa4-4e21-a43d-6ac5a790fa50	6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	USER_REGISTERED	User	6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.569
c1b48d2f-f095-4126-8f2f-fba81d66dc46	624c9927-2fb2-4e19-9078-5538bf62bcf0	USER_REGISTERED	User	624c9927-2fb2-4e19-9078-5538bf62bcf0	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.653
cedf861c-a3a4-401e-955b-ce28b48782ea	c18ed417-cba1-4216-bd3b-da4ff5439208	USER_REGISTERED	User	c18ed417-cba1-4216-bd3b-da4ff5439208	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.745
baaf9985-3400-4143-be30-88e194b73d5c	c2e29702-b6d2-4824-ba85-758f783c2cdd	USER_REGISTERED	User	c2e29702-b6d2-4824-ba85-758f783c2cdd	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.831
522e14c7-30f9-4335-b3d4-20ba02629a87	f44b0d87-d9cd-4a31-bac4-e23150a940aa	USER_REGISTERED	User	f44b0d87-d9cd-4a31-bac4-e23150a940aa	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.914
1106226e-65c5-479f-9799-0034d1d400f9	ad7dfab0-50f0-4b04-9b96-d952974e1b4c	USER_REGISTERED	User	ad7dfab0-50f0-4b04-9b96-d952974e1b4c	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:38.999
c8a02d4e-42c7-49f1-a633-cb4fa1c2fa4f	566431b0-2d5d-46ae-ad6d-f6cf58b38979	USER_REGISTERED	User	566431b0-2d5d-46ae-ad6d-f6cf58b38979	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.086
fedb4ce2-8967-4208-83d7-9f19b66fa627	832b8f02-fe80-4921-b322-5ceec5f8c256	USER_REGISTERED	User	832b8f02-fe80-4921-b322-5ceec5f8c256	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.256
ae9c8791-5f10-4bca-961f-dab34dda3d3e	0feb9f97-3a95-4931-b739-5fee9167bb85	USER_REGISTERED	User	0feb9f97-3a95-4931-b739-5fee9167bb85	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.375
4bb317d3-4e50-4491-a61a-b3743d9f639b	68d1b57a-97b8-436e-ab56-3cd621a10dc4	USER_REGISTERED	User	68d1b57a-97b8-436e-ab56-3cd621a10dc4	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.496
465da1e5-8eda-4f11-b126-d91e6580f844	98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	USER_REGISTERED	User	98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.653
d76283b0-6be2-4631-9b79-ec508f3b99b5	7cb420a8-33f6-481e-abcb-79321b782d92	USER_REGISTERED	User	7cb420a8-33f6-481e-abcb-79321b782d92	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.778
607cfbe9-c05b-4cca-aa69-01dfa0e15635	5a9ce727-6e8e-44a7-bf72-07799033906f	USER_REGISTERED	User	5a9ce727-6e8e-44a7-bf72-07799033906f	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.889
1caf323a-9038-4911-8b05-24085e638986	f5e19019-e70c-4c21-9f84-93f586eba254	USER_REGISTERED	User	f5e19019-e70c-4c21-9f84-93f586eba254	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:39.997
3166c9d5-863a-4874-a9a0-b8124f155755	c84105fb-4bf5-4b00-9fca-ed8c9eae0103	USER_REGISTERED	User	c84105fb-4bf5-4b00-9fca-ed8c9eae0103	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:40.097
148fe669-fcb3-4ef0-9e3b-87d0d80fbe7d	ccdf2fe7-2ee8-471a-bf65-ee7c167db398	USER_REGISTERED	User	ccdf2fe7-2ee8-471a-bf65-ee7c167db398	\N	t	\N	::ffff:192.168.65.1	curl/8.7.1	2026-04-20 15:42:40.207
e676f869-733b-4b02-9cce-ba07334db147	832b8f02-fe80-4921-b322-5ceec5f8c256	LOGIN_SUCCESS	\N	\N	\N	t	\N	::ffff:172.18.0.15	node	2026-04-20 15:42:47.363
7c1501d5-f7cd-42bf-8d48-5641d0cb81e3	fe3e467b-2a1e-46e6-a36b-e961f391aed0	LOGIN_SUCCESS	\N	\N	\N	t	\N	::ffff:172.18.0.14	PiumsCliente/1 CFNetwork/3860.400.51 Darwin/25.2.0	2026-04-20 15:53:03.709
042b6270-fe0b-4c9a-a2f9-0da9a3bc5248	832b8f02-fe80-4921-b322-5ceec5f8c256	LOGIN_SUCCESS	\N	\N	\N	t	\N	::ffff:172.18.0.15	node	2026-04-20 15:54:14.144
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.email_verifications (id, "userId", email, "tokenHash", status, "verifiedAt", "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.password_resets (id, "userId", "tokenHash", status, "usedAt", "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.refresh_tokens (id, "userId", "tokenHash", "userAgent", "ipAddress", "deviceId", "isRevoked", "revokedAt", used, "usedAt", "expiresAt", "createdAt", "updatedAt") FROM stdin;
21c08120-0e54-4622-9ea7-79279b2adab9	fe3e467b-2a1e-46e6-a36b-e961f391aed0	f235d6b1454ce52cd599dbfd377086bf6d264931bfb0fea5d09a7c900ef9416f	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.215	2026-04-20 15:42:38.216	2026-04-20 15:42:38.216
1845b00f-7eec-42c3-8f58-692932ff5adb	8d320158-ce66-4067-b978-337a75b05071	e002fe81a79e75b7d1378b5ae3a1276ea66dc29f21933d04d4f2cd11bfd8b98b	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.317	2026-04-20 15:42:38.318	2026-04-20 15:42:38.318
c99ca537-d73d-45b7-8696-11ee19c75e75	762ab74c-b7b4-4f9d-8204-05fb40df7ec6	6e560d0773e432ad19236583c4e26f3e78bdd28aa05f6898254fe27f209a28e9	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.401	2026-04-20 15:42:38.402	2026-04-20 15:42:38.402
8f3b54a9-4432-4740-bc29-ca5ce531bde2	f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	2c44978590b5fc431a9b3ec36e140c4f032c94808bdbe5a5df88029624a04b41	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.484	2026-04-20 15:42:38.484	2026-04-20 15:42:38.484
19d0e3ac-bc56-40b5-a997-a94fd0602334	6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	a29454392f95b019339ccd9719e671a8294a14e0a8be5adf47dca0675be6ec7c	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.566	2026-04-20 15:42:38.567	2026-04-20 15:42:38.567
47508d85-a76f-4fb7-a596-196013cd8432	624c9927-2fb2-4e19-9078-5538bf62bcf0	984b0279edbe4532a43acca28b817d74012b2a9f4cd3680be83d55bb8c3f269b	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.65	2026-04-20 15:42:38.651	2026-04-20 15:42:38.651
799fe8fd-1856-4468-bae9-53d2494dd609	c18ed417-cba1-4216-bd3b-da4ff5439208	892d9583abf822b37a7d42f8292165793cbcd4287a776656ac4109539668a071	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.742	2026-04-20 15:42:38.743	2026-04-20 15:42:38.743
7aca358a-b3f3-4001-b23b-5261f4559bcf	c2e29702-b6d2-4824-ba85-758f783c2cdd	fad3c8a7e25a8793ef0e73d09a9a5a8b53cd101133782e817f37e1e6290ca494	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.829	2026-04-20 15:42:38.83	2026-04-20 15:42:38.83
c38836e1-f319-4da9-aed4-5b80a39795ff	f44b0d87-d9cd-4a31-bac4-e23150a940aa	410fce668982f098556172d264ff34a308d6cdd57a3e9e78372c05e94733a45c	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.912	2026-04-20 15:42:38.913	2026-04-20 15:42:38.913
49dbea84-4eb4-425f-82d7-9755e7bc38d2	ad7dfab0-50f0-4b04-9b96-d952974e1b4c	f7c17b34c2574054c8bd4a4d4cb7c81f68f4dd3d91187ce42265ba1904ca85c0	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:38.996	2026-04-20 15:42:38.996	2026-04-20 15:42:38.996
ae6cac6a-d133-4315-8e54-4f86da318938	566431b0-2d5d-46ae-ad6d-f6cf58b38979	504195825f59fb7b7a6a35503a10ecef758e42d83ef992b770085b21f16b5077	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.084	2026-04-20 15:42:39.085	2026-04-20 15:42:39.085
fb0a2cdc-a83c-4777-bd15-923d30889420	832b8f02-fe80-4921-b322-5ceec5f8c256	cff5b72f2f5b21f4ccf4f0ce37e77e299f06f72d4a5d4291b28a9162a9157ca9	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.253	2026-04-20 15:42:39.254	2026-04-20 15:42:39.254
3751a98e-791d-4781-8b62-0b17804e6a58	0feb9f97-3a95-4931-b739-5fee9167bb85	2e5a7563efc11f97f155ba64311c3492a88e3c34e305495706aee47be414cc33	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.373	2026-04-20 15:42:39.373	2026-04-20 15:42:39.373
31315a54-5609-446e-aa86-f5559abb02ba	68d1b57a-97b8-436e-ab56-3cd621a10dc4	c8e895edf556ec358d075a9788eefa4796a99f5340edeecb4b6c5f89a0138173	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.494	2026-04-20 15:42:39.494	2026-04-20 15:42:39.494
0562d9ab-6977-4215-8e0c-5dad1f697d47	98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	e699fccffcd744fd329b0e12bf2f04796587cba61c0caf1529da2f04123f9968	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.648	2026-04-20 15:42:39.649	2026-04-20 15:42:39.649
58622e27-cecc-4e62-bba1-5c151076cb93	7cb420a8-33f6-481e-abcb-79321b782d92	4bd5a84c575037bf5975ae5c435f8e5a74d0c2ce45d4ab025e87b103899543ef	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.776	2026-04-20 15:42:39.777	2026-04-20 15:42:39.777
78ecd49e-46c5-468b-b7b7-c09029a6436f	5a9ce727-6e8e-44a7-bf72-07799033906f	67cf38ab60360f8cd7a456784c17146b9eba7d31bff3d36c8cf1812aac7f9d15	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.887	2026-04-20 15:42:39.888	2026-04-20 15:42:39.888
cd4d0d4e-842f-4316-839e-f9d3fa545cd2	f5e19019-e70c-4c21-9f84-93f586eba254	2e30f6554a37f928c13f0bffde0331a55a626221222ac1de29eecb8490509712	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:39.995	2026-04-20 15:42:39.995	2026-04-20 15:42:39.995
ee586c95-c7a9-4db5-9d23-9a2d46914920	c84105fb-4bf5-4b00-9fca-ed8c9eae0103	70b54cbecb40503a7cea9d099c1d78d1a9967a55585e6382c2163841b40752d1	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:40.095	2026-04-20 15:42:40.095	2026-04-20 15:42:40.095
0028b59f-4466-4f6c-b8e0-4cc2be982d19	ccdf2fe7-2ee8-471a-bf65-ee7c167db398	fc0f765be50e7969bf0cc33afeed18b527d311a4438f55e06551ded7c5e89af2	curl/8.7.1	::ffff:192.168.65.1	\N	f	\N	f	\N	2026-04-27 15:42:40.205	2026-04-20 15:42:40.206	2026-04-20 15:42:40.206
4edf8e95-9b87-4f4c-967d-4e3d454d0d14	832b8f02-fe80-4921-b322-5ceec5f8c256	2f96f828278f73c1750f80b9f31415892c6d48974b369bd512b7fed4fddda56a	node	::ffff:172.18.0.15	\N	f	\N	f	\N	2026-04-27 15:42:47.361	2026-04-20 15:42:47.361	2026-04-20 15:42:47.361
fdc3f064-ed89-4af3-b510-01c81ee94fc5	fe3e467b-2a1e-46e6-a36b-e961f391aed0	afd01d19489df4c61d646d32ebab0c2d86cad2589a81a86e195db392ba0e4bdf	PiumsCliente/1 CFNetwork/3860.400.51 Darwin/25.2.0	::ffff:172.18.0.14	\N	f	\N	f	\N	2026-04-27 15:53:03.703	2026-04-20 15:53:03.703	2026-04-20 15:53:03.703
6f9219a5-4aad-4d30-8f20-a4e569dcb4a9	832b8f02-fe80-4921-b322-5ceec5f8c256	b7bf8ef29a8b06819b096e16e99032618b1234d820c6f03240a65c623fbcf539	node	::ffff:172.18.0.15	\N	f	\N	f	\N	2026-04-27 15:54:14.14	2026-04-20 15:54:14.141	2026-04-20 15:54:14.141
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.sessions (id, "userId", jti, "userAgent", "ipAddress", "deviceId", "deviceName", status, "lastActivity", "expiresAt", "revokedAt", "createdAt", "updatedAt") FROM stdin;
ff40da26-cc7c-4c01-a122-30afaf47f86a	fe3e467b-2a1e-46e6-a36b-e961f391aed0	733ca96a-d227-48f6-a4f8-d67129aa89d3	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.22	2026-04-20 16:42:38.22	\N	2026-04-20 15:42:38.22	2026-04-20 15:42:38.22
59082cfa-840f-4583-a144-48fc6c0ab5f0	8d320158-ce66-4067-b978-337a75b05071	c2e5bbf1-9ec4-47fb-be0b-00ba861ebb31	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.32	2026-04-20 16:42:38.319	\N	2026-04-20 15:42:38.32	2026-04-20 15:42:38.32
c804c999-070d-4fc4-b4fd-6e0a5f9cbc13	762ab74c-b7b4-4f9d-8204-05fb40df7ec6	f3f259e6-2a77-4e31-bd76-1991fcd68bd8	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.403	2026-04-20 16:42:38.402	\N	2026-04-20 15:42:38.403	2026-04-20 15:42:38.403
04256f82-3c05-4df5-a911-48261ba7e7aa	f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	4836cfec-72e7-4e91-9519-0e43f146af5a	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.485	2026-04-20 16:42:38.485	\N	2026-04-20 15:42:38.485	2026-04-20 15:42:38.485
373ba80e-e87d-4333-9239-6acf25270c40	6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	70b92693-cc0d-4396-86c9-b7c0eecb700e	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.568	2026-04-20 16:42:38.568	\N	2026-04-20 15:42:38.568	2026-04-20 15:42:38.568
c746a6f4-a67b-4023-ac59-725327f121cc	624c9927-2fb2-4e19-9078-5538bf62bcf0	b8c82f19-fe56-4b02-ae84-c4baf81e3079	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.652	2026-04-20 16:42:38.652	\N	2026-04-20 15:42:38.652	2026-04-20 15:42:38.652
aea5be6b-0e00-4788-b8c6-4528bb695d6f	c18ed417-cba1-4216-bd3b-da4ff5439208	dbdf5254-64c1-4abc-934d-ecbb89224e13	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.743	2026-04-20 16:42:38.743	\N	2026-04-20 15:42:38.743	2026-04-20 15:42:38.743
dcedbbe3-4a17-4dcc-8324-31dc66e629ab	c2e29702-b6d2-4824-ba85-758f783c2cdd	e6a19e40-bf10-4583-93d5-136e56203a0c	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.831	2026-04-20 16:42:38.83	\N	2026-04-20 15:42:38.831	2026-04-20 15:42:38.831
4508a12e-4310-4497-9e30-477a937c5c6b	f44b0d87-d9cd-4a31-bac4-e23150a940aa	521772a7-40ea-452c-bf5b-d2e9a7063e16	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.913	2026-04-20 16:42:38.913	\N	2026-04-20 15:42:38.913	2026-04-20 15:42:38.913
60734f60-ce3e-4a45-a9a1-3c4577169642	ad7dfab0-50f0-4b04-9b96-d952974e1b4c	41a022b0-27ac-4b35-8520-b79caef1b1fb	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:38.998	2026-04-20 16:42:38.997	\N	2026-04-20 15:42:38.998	2026-04-20 15:42:38.998
4170b80d-1770-4fb2-b24e-0aa9d2a1401f	566431b0-2d5d-46ae-ad6d-f6cf58b38979	d148bf53-a2a5-49bc-a2ad-900418ef2b11	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.086	2026-04-20 16:42:39.085	\N	2026-04-20 15:42:39.086	2026-04-20 15:42:39.086
a2b4e896-56f5-41b2-bbb8-8fd9fc4495cf	832b8f02-fe80-4921-b322-5ceec5f8c256	512ba38f-2c82-4855-b6ac-42f4bc34e299	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.255	2026-04-20 16:42:39.254	\N	2026-04-20 15:42:39.255	2026-04-20 15:42:39.255
548e976e-e89a-4924-8142-f259243647dc	0feb9f97-3a95-4931-b739-5fee9167bb85	b01a036e-a919-46f3-9b64-e1ddc09f09b1	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.374	2026-04-20 16:42:39.374	\N	2026-04-20 15:42:39.374	2026-04-20 15:42:39.374
180fa7c4-d341-4706-8735-f107eb86346b	68d1b57a-97b8-436e-ab56-3cd621a10dc4	a2897a92-b49e-4882-b004-c7259e480ecf	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.495	2026-04-20 16:42:39.495	\N	2026-04-20 15:42:39.495	2026-04-20 15:42:39.495
ec57ef3b-b97c-41ad-896e-189c7aeb9d61	98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	7911d0d4-562d-4c6b-adb1-211db792a6a7	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.651	2026-04-20 16:42:39.65	\N	2026-04-20 15:42:39.651	2026-04-20 15:42:39.651
29866f73-be65-40de-a06f-09d9972fcc55	7cb420a8-33f6-481e-abcb-79321b782d92	798cd8d6-cac6-4da3-a7ff-a4c3851a3d69	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.778	2026-04-20 16:42:39.777	\N	2026-04-20 15:42:39.778	2026-04-20 15:42:39.778
8e348367-7141-4352-bf01-20cbf50c25d2	5a9ce727-6e8e-44a7-bf72-07799033906f	16f5f891-6170-4d06-b089-be242f981b6e	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.889	2026-04-20 16:42:39.888	\N	2026-04-20 15:42:39.889	2026-04-20 15:42:39.889
5433ae92-668a-4d19-96d7-ad1b0827d7bc	f5e19019-e70c-4c21-9f84-93f586eba254	d92377ad-3194-43dd-9bf7-8b8d09b2514a	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:39.996	2026-04-20 16:42:39.996	\N	2026-04-20 15:42:39.996	2026-04-20 15:42:39.996
bc1de6df-4f77-4df3-9bff-2be99d8ab293	c84105fb-4bf5-4b00-9fca-ed8c9eae0103	10a4d880-a2b4-477e-8c97-2af07234d48d	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:40.096	2026-04-20 16:42:40.095	\N	2026-04-20 15:42:40.096	2026-04-20 15:42:40.096
f232b02a-af17-481e-aab8-f5ed9e0a4997	ccdf2fe7-2ee8-471a-bf65-ee7c167db398	e15621fd-17eb-488d-bdd1-a3cf513c3be7	curl/8.7.1	::ffff:192.168.65.1	\N	\N	ACTIVE	2026-04-20 15:42:40.206	2026-04-20 16:42:40.206	\N	2026-04-20 15:42:40.206	2026-04-20 15:42:40.206
bbb8478a-1b69-4a7a-865b-d4485ea7f2f4	832b8f02-fe80-4921-b322-5ceec5f8c256	3a38bbdc-e945-4405-8aaf-3339dc993ba4	node	::ffff:172.18.0.15	\N	\N	ACTIVE	2026-04-20 15:42:47.363	2026-04-20 15:57:47.362	\N	2026-04-20 15:42:47.363	2026-04-20 15:42:47.363
a30937b2-5661-4e94-9909-9e37eedab4a0	fe3e467b-2a1e-46e6-a36b-e961f391aed0	3c54f87b-74a4-47c1-9255-baa42737c70f	PiumsCliente/1 CFNetwork/3860.400.51 Darwin/25.2.0	::ffff:172.18.0.14	\N	\N	ACTIVE	2026-04-20 15:53:03.705	2026-04-20 16:08:03.705	\N	2026-04-20 15:53:03.705	2026-04-20 15:53:03.705
6b9bbc2a-90fa-41d8-9858-460a151101b6	832b8f02-fe80-4921-b322-5ceec5f8c256	ac9cac3f-ea26-458b-b11e-c430fe914f05	node	::ffff:172.18.0.15	\N	\N	ACTIVE	2026-04-20 15:54:14.143	2026-04-20 16:09:14.142	\N	2026-04-20 15:54:14.143	2026-04-20 15:54:14.143
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.users (id, email, "emailVerified", "passwordHash", nombre, name, avatar, provider, "googleId", "facebookId", "tiktokId", role, "isBlocked", "isVerified", status, "twoFactorEnabled", "twoFactorSecret", "backupCodes", "lastLoginAt", "lastLoginIp", "onboardingCompletedAt", "lastPasswordChange", "failedLoginAttempts", "lockedUntil", ciudad, "birthDate", "documentType", "documentNumber", "documentFrontUrl", "documentBackUrl", "documentSelfieUrl", "rejectionReason", "adminNotes", "createdAt", "updatedAt", "deletedAt") FROM stdin;
8d320158-ce66-4067-b978-337a75b05071	client02@piums.com	t	$2a$10$300LeJGBfvrYmW.BPlScse6QDhqc8LN1/Ng1/9Fvy417EFmBvEFTe	Carlos Rodríguez	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.314	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.314	2026-04-20 15:42:38.314	\N
762ab74c-b7b4-4f9d-8204-05fb40df7ec6	client03@piums.com	t	$2a$10$4Fr6OeC2C892CHLdGF9OUeML0HT3Q7R9.EhQqAEmo3U.aQT8.G/7C	Lucía Herrera	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.399	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.399	2026-04-20 15:42:38.399	\N
f59b74b2-bb02-4193-8d28-b2f6fc1cfff4	client04@piums.com	t	$2a$10$nTnomYOX8/QEQDt4nljL3uPHe29QI4ln3833DEjc1SNlMBz7quVii	Fernando López	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.481	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.481	2026-04-20 15:42:38.481	\N
6ee9b6da-3661-44ef-9b2c-e8dea819f5d7	client05@piums.com	t	$2a$10$fioF9iHl1.Xfemsayh0lveGYlQHTFutA22SFrBWJjBXQrkZUba/5S	Gabriela Morales	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.563	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.563	2026-04-20 15:42:38.563	\N
624c9927-2fb2-4e19-9078-5538bf62bcf0	client06@piums.com	t	$2a$10$EXjemTrbnmiNFTZVBlT5KOqBmNs6bw9EF5lb6QWzFznBhYaJs2RoC	Mario Ajú	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.648	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.648	2026-04-20 15:42:38.648	\N
c18ed417-cba1-4216-bd3b-da4ff5439208	client07@piums.com	t	$2a$10$ojZ2wi76eOL5IZWl6tMU7u0j/koAc.EhK2hkB3R9zqqyc8NKIa9E6	Stefanie Vega	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.74	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.74	2026-04-20 15:42:38.74	\N
c2e29702-b6d2-4824-ba85-758f783c2cdd	client08@piums.com	t	$2a$10$Du8BlOd6uXs7AZ8Mcph2TuMwDbwUfoGS861FtzIri/ThHXOa4WPPq	Rodrigo Pérez	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.827	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.827	2026-04-20 15:42:38.827	\N
f44b0d87-d9cd-4a31-bac4-e23150a940aa	client09@piums.com	t	$2a$10$hA3CoEniKZ7me/l9wgaUSOA/x/wuxUkatvqAMAheVFBlL8OrDZ46.	Valeria Torres	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.91	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.91	2026-04-20 15:42:38.91	\N
ad7dfab0-50f0-4b04-9b96-d952974e1b4c	client10@piums.com	t	$2a$10$QvV45.VhV2F2/Fu9F0pCxOyhIicskHbhifkSMawvBFiIyan7UUmHq	Diego Fuentes	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:38.993	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.993	2026-04-20 15:42:38.993	\N
566431b0-2d5d-46ae-ad6d-f6cf58b38979	artist01@piums.com	t	$2a$10$ffjGOwvXycGlItRmxMzUUOwzHnbzOgymZrawVNxCM.9GJni4HzR86	María González	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.082	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.082	2026-04-20 15:42:39.082	\N
0feb9f97-3a95-4931-b739-5fee9167bb85	artist03@piums.com	t	$2a$10$Fr67E7tpbeP1bbuRUOvfpOt5AzKdYlOjBxaeK7.CiEm3HcLQahaCi	Alejandro Díaz	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.37	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.37	2026-04-20 15:42:39.37	\N
68d1b57a-97b8-436e-ab56-3cd621a10dc4	artist04@piums.com	t	$2a$10$ujjwLKLFSXa6XBv3LelvkedPx3MS3RILxlTFXqSIAairdc4AOgVGa	Sofía Morales	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.492	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.492	2026-04-20 15:42:39.492	\N
98f1d79a-a36c-4255-a0bc-fa0e027dfa8a	artist05@piums.com	t	$2a$10$2HgX7Q747jkvSWADEoucYO4zy8J4KHkXfww6mnj5wlzORstzkwJca	Diego Castro	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.643	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.643	2026-04-20 15:42:39.643	\N
7cb420a8-33f6-481e-abcb-79321b782d92	artist06@piums.com	t	$2a$10$/YTGPizDdlYa4WKPTFTQuedonFj8Iq1Vxugb7DdALs6V2QCwOgkba	Paola Ajú	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.775	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.775	2026-04-20 15:42:39.775	\N
5a9ce727-6e8e-44a7-bf72-07799033906f	artist07@piums.com	t	$2a$10$H/dW.W3/QFPelAaBvmkSl.zCb78rU2U3PEW6Zc0Pg/D1SCGTScWWC	Humberto Ruiz	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.885	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.885	2026-04-20 15:42:39.885	\N
f5e19019-e70c-4c21-9f84-93f586eba254	artist08@piums.com	t	$2a$10$n6wBpCCs/lBFwSWnEg8g..rba.CdeezCy.uyLGTxOgBT3spXAXxzq	Claudia Chávez	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:39.993	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.993	2026-04-20 15:42:39.993	\N
c84105fb-4bf5-4b00-9fca-ed8c9eae0103	artist09@piums.com	t	$2a$10$rltk85S0bCGUbb03JX7Ztur/NzaTDNwzqsNIUhDO9OwjBHswg8XWW	Samuel Tzul	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:40.092	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:40.092	2026-04-20 15:42:40.092	\N
ccdf2fe7-2ee8-471a-bf65-ee7c167db398	artist10@piums.com	t	$2a$10$qx.MFHKsy84k2H5l.pZEauswyW/cGOdNBtHdfUl.QV8.BOgGnF4fG	Renata Morán	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	\N	\N	\N	2026-04-20 15:42:40.203	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:40.203	2026-04-20 15:42:40.203	\N
fe3e467b-2a1e-46e6-a36b-e961f391aed0	client01@piums.com	t	$2a$10$/3C/MyuRLyheMRhcQmS4zOFxSZTJhzA81gXJM1TOSZd4mEPIfv3rC	Ana Cifuentes	\N	\N	\N	\N	\N	\N	cliente	f	f	ACTIVE	f	\N	\N	2026-04-20 15:53:03.695	\N	\N	2026-04-20 15:42:38.186	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:38.186	2026-04-20 15:53:03.696	\N
832b8f02-fe80-4921-b322-5ceec5f8c256	artist02@piums.com	t	$2a$10$UiB6VRfcpa7flr3vGr7oauWmAxkg/PE.UJHCkvFS7v.WP6x8mcFu6	Roberto Pérez	\N	\N	\N	\N	\N	\N	artista	f	f	ACTIVE	f	\N	\N	2026-04-20 15:54:14.135	\N	\N	2026-04-20 15:42:39.251	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 15:42:39.251	2026-04-20 15:54:14.136	\N
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: email_verifications_email_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX email_verifications_email_idx ON public.email_verifications USING btree (email);


--
-- Name: email_verifications_expiresAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "email_verifications_expiresAt_idx" ON public.email_verifications USING btree ("expiresAt");


--
-- Name: email_verifications_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX email_verifications_status_idx ON public.email_verifications USING btree (status);


--
-- Name: email_verifications_tokenHash_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "email_verifications_tokenHash_idx" ON public.email_verifications USING btree ("tokenHash");


--
-- Name: email_verifications_tokenHash_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "email_verifications_tokenHash_key" ON public.email_verifications USING btree ("tokenHash");


--
-- Name: email_verifications_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "email_verifications_userId_idx" ON public.email_verifications USING btree ("userId");


--
-- Name: password_resets_expiresAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "password_resets_expiresAt_idx" ON public.password_resets USING btree ("expiresAt");


--
-- Name: password_resets_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX password_resets_status_idx ON public.password_resets USING btree (status);


--
-- Name: password_resets_tokenHash_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "password_resets_tokenHash_idx" ON public.password_resets USING btree ("tokenHash");


--
-- Name: password_resets_tokenHash_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "password_resets_tokenHash_key" ON public.password_resets USING btree ("tokenHash");


--
-- Name: password_resets_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "password_resets_userId_idx" ON public.password_resets USING btree ("userId");


--
-- Name: refresh_tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "refresh_tokens_expiresAt_idx" ON public.refresh_tokens USING btree ("expiresAt");


--
-- Name: refresh_tokens_isRevoked_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "refresh_tokens_isRevoked_idx" ON public.refresh_tokens USING btree ("isRevoked");


--
-- Name: refresh_tokens_tokenHash_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "refresh_tokens_tokenHash_idx" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: refresh_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "sessions_expiresAt_idx" ON public.sessions USING btree ("expiresAt");


--
-- Name: sessions_jti_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX sessions_jti_idx ON public.sessions USING btree (jti);


--
-- Name: sessions_jti_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX sessions_jti_key ON public.sessions USING btree (jti);


--
-- Name: sessions_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX sessions_status_idx ON public.sessions USING btree (status);


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: users_emailVerified_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "users_emailVerified_idx" ON public.users USING btree ("emailVerified");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_facebookId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "users_facebookId_idx" ON public.users USING btree ("facebookId");


--
-- Name: users_facebookId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "users_facebookId_key" ON public.users USING btree ("facebookId");


--
-- Name: users_googleId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "users_googleId_idx" ON public.users USING btree ("googleId");


--
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX users_status_idx ON public.users USING btree (status);


--
-- Name: users_tiktokId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "users_tiktokId_key" ON public.users USING btree ("tiktokId");


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_verifications email_verifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT "email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_resets password_resets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ZoGczwzjVIf3LCIjIYLqm4mBgi3T89Hw2xuYduFPwsNk7g5F2noq5xFgt9zTvEB

