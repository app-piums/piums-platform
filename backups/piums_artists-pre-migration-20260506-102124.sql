--
-- PostgreSQL database dump
--

\restrict looQKEsxDcg0Y0ffukyoYNZ9Ex83wnxy9gyrPsbn6NjkTUcfiyA0hzu6u2BXCN8

-- Dumped from database version 18.2 (Postgres.app)
-- Dumped by pg_dump version 18.2 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ArtistCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ArtistCategory" AS ENUM (
    'MUSICO',
    'TATUADOR',
    'FOTOGRAFO',
    'MAQUILLADOR',
    'DJ',
    'PINTOR',
    'ESCULTOR',
    'OTRO'
);


ALTER TYPE public."ArtistCategory" OWNER TO postgres;

--
-- Name: DayOfWeek; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DayOfWeek" AS ENUM (
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
);


ALTER TYPE public."DayOfWeek" OWNER TO postgres;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'SUSPENDED'
);


ALTER TYPE public."VerificationStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: artist_availability_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artist_availability_rules (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "dayOfWeek" public."DayOfWeek" NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.artist_availability_rules OWNER TO postgres;

--
-- Name: artist_blackouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artist_blackouts (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.artist_blackouts OWNER TO postgres;

--
-- Name: artists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artists (
    id text NOT NULL,
    "authId" text NOT NULL,
    email text NOT NULL,
    nombre text NOT NULL,
    "artistName" text,
    avatar text,
    bio text,
    category public."ArtistCategory" NOT NULL,
    specialties text[],
    "yearsExperience" integer DEFAULT 0 NOT NULL,
    country text NOT NULL,
    city text NOT NULL,
    state text,
    address text,
    lat double precision,
    lng double precision,
    "coverageRadius" integer DEFAULT 10 NOT NULL,
    "hourlyRateMin" integer,
    "hourlyRateMax" integer,
    currency text DEFAULT 'MXN'::text NOT NULL,
    "cancellationPolicy" text,
    "requiresDeposit" boolean DEFAULT false NOT NULL,
    "depositPercentage" integer,
    "verificationStatus" public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    website text,
    instagram text,
    facebook text,
    youtube text,
    tiktok text,
    "isActive" boolean DEFAULT true NOT NULL,
    rating double precision DEFAULT 0.0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "bookingCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "categoryId" text,
    "cityId" text,
    "baseLocationLabel" text,
    "baseLocationLat" double precision,
    "baseLocationLng" double precision
);


ALTER TABLE public.artists OWNER TO postgres;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certifications (
    id text NOT NULL,
    "artistId" text NOT NULL,
    title text NOT NULL,
    issuer text NOT NULL,
    description text,
    "documentUrl" text,
    "issuedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.certifications OWNER TO postgres;

--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_items (
    id text NOT NULL,
    "artistId" text NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    url text NOT NULL,
    "thumbnailUrl" text,
    category text,
    tags text[],
    "order" integer DEFAULT 0 NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.portfolio_items OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
af0fe912-fd51-49c0-a31c-1fa3e7b0acd0	27a55581b127ce08ba0cd6a76e18bda22d119af5bda36eced866cdfb2d93e660	2026-03-23 15:40:18.626982-06	20240323120000_add_base_location_fields		\N	2026-03-23 15:40:18.626982-06	0
\.


--
-- Data for Name: artist_availability_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artist_availability_rules (id, "artistId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: artist_blackouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artist_blackouts (id, "artistId", "startAt", "endAt", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: artists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artists (id, "authId", email, nombre, "artistName", avatar, bio, category, specialties, "yearsExperience", country, city, state, address, lat, lng, "coverageRadius", "hourlyRateMin", "hourlyRateMax", currency, "cancellationPolicy", "requiresDeposit", "depositPercentage", "verificationStatus", "verifiedAt", "rejectionReason", website, instagram, facebook, youtube, tiktok, "isActive", rating, "reviewCount", "bookingCount", "createdAt", "updatedAt", "deletedAt", "categoryId", "cityId", "baseLocationLabel", "baseLocationLat", "baseLocationLng") FROM stdin;
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certifications (id, "artistId", title, issuer, description, "documentUrl", "issuedAt", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portfolio_items (id, "artistId", title, description, type, url, "thumbnailUrl", category, tags, "order", "isFeatured", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: artist_availability_rules artist_availability_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artist_availability_rules
    ADD CONSTRAINT artist_availability_rules_pkey PRIMARY KEY (id);


--
-- Name: artist_blackouts artist_blackouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artist_blackouts
    ADD CONSTRAINT artist_blackouts_pkey PRIMARY KEY (id);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: artist_availability_rules_artistId_dayOfWeek_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_availability_rules_artistId_dayOfWeek_isActive_idx" ON public.artist_availability_rules USING btree ("artistId", "dayOfWeek", "isActive");


--
-- Name: artist_availability_rules_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_availability_rules_artistId_idx" ON public.artist_availability_rules USING btree ("artistId");


--
-- Name: artist_availability_rules_dayOfWeek_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_availability_rules_dayOfWeek_idx" ON public.artist_availability_rules USING btree ("dayOfWeek");


--
-- Name: artist_blackouts_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_blackouts_artistId_idx" ON public.artist_blackouts USING btree ("artistId");


--
-- Name: artist_blackouts_artistId_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_blackouts_artistId_startAt_endAt_idx" ON public.artist_blackouts USING btree ("artistId", "startAt", "endAt");


--
-- Name: artist_blackouts_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artist_blackouts_startAt_endAt_idx" ON public.artist_blackouts USING btree ("startAt", "endAt");


--
-- Name: artists_authId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artists_authId_idx" ON public.artists USING btree ("authId");


--
-- Name: artists_authId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "artists_authId_key" ON public.artists USING btree ("authId");


--
-- Name: artists_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artists_categoryId_idx" ON public.artists USING btree ("categoryId");


--
-- Name: artists_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_category_idx ON public.artists USING btree (category);


--
-- Name: artists_cityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artists_cityId_idx" ON public.artists USING btree ("cityId");


--
-- Name: artists_city_country_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_city_country_idx ON public.artists USING btree (city, country);


--
-- Name: artists_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_email_idx ON public.artists USING btree (email);


--
-- Name: artists_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX artists_email_key ON public.artists USING btree (email);


--
-- Name: artists_lat_lng_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_lat_lng_idx ON public.artists USING btree (lat, lng);


--
-- Name: artists_verificationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "artists_verificationStatus_idx" ON public.artists USING btree ("verificationStatus");


--
-- Name: certifications_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "certifications_artistId_idx" ON public.certifications USING btree ("artistId");


--
-- Name: portfolio_items_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "portfolio_items_artistId_idx" ON public.portfolio_items USING btree ("artistId");


--
-- Name: portfolio_items_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX portfolio_items_type_idx ON public.portfolio_items USING btree (type);


--
-- Name: artist_availability_rules artist_availability_rules_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artist_availability_rules
    ADD CONSTRAINT "artist_availability_rules_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: artist_blackouts artist_blackouts_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artist_blackouts
    ADD CONSTRAINT "artist_blackouts_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: certifications certifications_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT "certifications_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portfolio_items portfolio_items_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT "portfolio_items_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict looQKEsxDcg0Y0ffukyoYNZ9Ex83wnxy9gyrPsbn6NjkTUcfiyA0hzu6u2BXCN8

