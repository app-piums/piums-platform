--
-- PostgreSQL database dump
--

\restrict VnZazw3JV2nS8uSKOtRqzVOsMxdoKxAczCp1mAxvbnP63OJxgTrYny6HpV2dNhJ

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
-- Name: MediaEntityType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."MediaEntityType" AS ENUM (
    'ARTIST',
    'SERVICE',
    'BOOKING',
    'REVIEW',
    'DISPUTE',
    'PROFILE',
    'CATEGORY',
    'CERTIFICATION',
    'OTHER'
);


ALTER TYPE public."MediaEntityType" OWNER TO piums;

--
-- Name: MediaStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."MediaStatus" AS ENUM (
    'UPLOADING',
    'PROCESSING',
    'READY',
    'FAILED',
    'DELETED'
);


ALTER TYPE public."MediaStatus" OWNER TO piums;

--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."MediaType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'OTHER'
);


ALTER TYPE public."MediaType" OWNER TO piums;

--
-- Name: PricingModel; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."PricingModel" AS ENUM (
    'FIXED',
    'BASE_PLUS_HOURLY',
    'PACKAGE'
);


ALTER TYPE public."PricingModel" OWNER TO piums;

--
-- Name: PricingType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."PricingType" AS ENUM (
    'FIXED',
    'HOURLY',
    'PER_SESSION',
    'CUSTOM'
);


ALTER TYPE public."PricingType" OWNER TO piums;

--
-- Name: ServiceStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ServiceStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."ServiceStatus" OWNER TO piums;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.cities (
    id text NOT NULL,
    "stateId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    timezone text,
    population integer,
    "isCapital" boolean DEFAULT false NOT NULL,
    "isMetro" boolean DEFAULT false NOT NULL,
    aliases text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "isPopular" boolean DEFAULT false NOT NULL,
    description text,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cities OWNER TO piums;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.countries (
    id text NOT NULL,
    name text NOT NULL,
    "shortName" text NOT NULL,
    code text NOT NULL,
    code3 text,
    continent text NOT NULL,
    region text,
    "phoneCode" text NOT NULL,
    currency text NOT NULL,
    "currencySymbol" text,
    languages text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "isPopular" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.countries OWNER TO piums;

--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.media_assets (
    id text NOT NULL,
    "mediaType" public."MediaType" NOT NULL,
    status public."MediaStatus" DEFAULT 'UPLOADING'::public."MediaStatus" NOT NULL,
    "entityType" public."MediaEntityType" NOT NULL,
    "entityId" text NOT NULL,
    "originalUrl" text NOT NULL,
    url text NOT NULL,
    "thumbnailUrl" text,
    filename text NOT NULL,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    width integer,
    height integer,
    duration integer,
    title text,
    description text,
    "altText" text,
    "order" integer DEFAULT 0 NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "storageProvider" text,
    "storageKey" text,
    "storageBucket" text,
    tags text[],
    metadata jsonb,
    "uploadedBy" text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.media_assets OWNER TO piums;

--
-- Name: service_addons; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.service_addons (
    id text NOT NULL,
    "serviceId" text NOT NULL,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isOptional" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_addons OWNER TO piums;

--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.service_categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    image text,
    "parentId" text,
    level integer DEFAULT 0 NOT NULL,
    path text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "metaTitle" text,
    "metaDescription" text,
    keywords text[],
    "serviceCount" integer DEFAULT 0 NOT NULL,
    "primaryColor" text,
    "secondaryColor" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_categories OWNER TO piums;

--
-- Name: service_packages; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.service_packages (
    id text NOT NULL,
    "artistId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "serviceIds" text[],
    "originalPrice" integer NOT NULL,
    "packagePrice" integer NOT NULL,
    savings integer NOT NULL,
    currency text DEFAULT 'GTQ'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    thumbnail text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_packages OWNER TO piums;

--
-- Name: service_pricing; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.service_pricing (
    id text NOT NULL,
    "serviceId" text NOT NULL,
    "pricingModel" public."PricingModel" NOT NULL,
    currency text DEFAULT 'GTQ'::text NOT NULL,
    "basePriceCents" integer NOT NULL,
    "includedMinutes" integer,
    "extraMinutePriceCents" integer,
    "minNoticeHours" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_pricing OWNER TO piums;

--
-- Name: service_travel_rules; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.service_travel_rules (
    id text NOT NULL,
    "serviceId" text NOT NULL,
    "includedKm" integer,
    "pricePerKmCents" integer,
    "maxDistanceKm" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_travel_rules OWNER TO piums;

--
-- Name: services; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.services (
    id text NOT NULL,
    "artistId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    "categoryId" text NOT NULL,
    "cityId" text,
    "pricingType" public."PricingType" NOT NULL,
    "basePrice" integer NOT NULL,
    currency text DEFAULT 'GTQ'::text NOT NULL,
    "durationMin" integer,
    "durationMax" integer,
    images text[],
    thumbnail text,
    status public."ServiceStatus" DEFAULT 'ACTIVE'::public."ServiceStatus" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "whatIsIncluded" text[],
    "requiresDeposit" boolean DEFAULT false NOT NULL,
    "depositAmount" integer,
    "depositPercentage" integer,
    "requiresConsultation" boolean DEFAULT false NOT NULL,
    "cancellationPolicy" text,
    "termsAndConditions" text,
    tags text[],
    "isMainService" boolean DEFAULT false NOT NULL,
    "minGuests" integer,
    "maxGuests" integer,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "bookingCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO piums;

--
-- Name: states; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.states (
    id text NOT NULL,
    "countryId" text NOT NULL,
    name text NOT NULL,
    "shortName" text,
    code text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.states OWNER TO piums;

--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.cities (id, "stateId", name, slug, latitude, longitude, timezone, population, "isCapital", "isMetro", aliases, "isActive", "isPopular", description, image, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.countries (id, name, "shortName", code, code3, continent, region, "phoneCode", currency, "currencySymbol", languages, "isActive", "isPopular", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.media_assets (id, "mediaType", status, "entityType", "entityId", "originalUrl", url, "thumbnailUrl", filename, "mimeType", "fileSize", width, height, duration, title, description, "altText", "order", "isFeatured", "isPublic", "storageProvider", "storageKey", "storageBucket", tags, metadata, "uploadedBy", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: service_addons; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_addons (id, "serviceId", name, description, price, "isRequired", "isOptional", "isDefault", "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_categories (id, name, slug, description, icon, image, "parentId", level, path, "order", "isActive", "isFeatured", "metaTitle", "metaDescription", keywords, "serviceCount", "primaryColor", "secondaryColor", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: service_packages; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_packages (id, "artistId", name, description, "serviceIds", "originalPrice", "packagePrice", savings, currency, "isActive", "validFrom", "validUntil", thumbnail, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: service_pricing; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_pricing (id, "serviceId", "pricingModel", currency, "basePriceCents", "includedMinutes", "extraMinutePriceCents", "minNoticeHours", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: service_travel_rules; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.service_travel_rules (id, "serviceId", "includedKm", "pricePerKmCents", "maxDistanceKm", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.services (id, "artistId", name, slug, description, "categoryId", "cityId", "pricingType", "basePrice", currency, "durationMin", "durationMax", images, thumbnail, status, "isAvailable", "isFeatured", "whatIsIncluded", "requiresDeposit", "depositAmount", "depositPercentage", "requiresConsultation", "cancellationPolicy", "termsAndConditions", tags, "isMainService", "minGuests", "maxGuests", "viewCount", "bookingCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.states (id, "countryId", name, "shortName", code, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: service_addons service_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_addons
    ADD CONSTRAINT service_addons_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_packages service_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_packages
    ADD CONSTRAINT service_packages_pkey PRIMARY KEY (id);


--
-- Name: service_pricing service_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_pricing
    ADD CONSTRAINT service_pricing_pkey PRIMARY KEY (id);


--
-- Name: service_travel_rules service_travel_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_travel_rules
    ADD CONSTRAINT service_travel_rules_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: cities_isActive_isPopular_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "cities_isActive_isPopular_idx" ON public.cities USING btree ("isActive", "isPopular");


--
-- Name: cities_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX cities_latitude_longitude_idx ON public.cities USING btree (latitude, longitude);


--
-- Name: cities_slug_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX cities_slug_idx ON public.cities USING btree (slug);


--
-- Name: cities_slug_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX cities_slug_key ON public.cities USING btree (slug);


--
-- Name: cities_stateId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "cities_stateId_idx" ON public.cities USING btree ("stateId");


--
-- Name: cities_stateId_name_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "cities_stateId_name_key" ON public.cities USING btree ("stateId", name);


--
-- Name: countries_code_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX countries_code_idx ON public.countries USING btree (code);


--
-- Name: countries_code_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX countries_code_key ON public.countries USING btree (code);


--
-- Name: countries_isActive_isPopular_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "countries_isActive_isPopular_idx" ON public.countries USING btree ("isActive", "isPopular");


--
-- Name: media_assets_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "media_assets_entityType_entityId_idx" ON public.media_assets USING btree ("entityType", "entityId");


--
-- Name: media_assets_entityType_entityId_mediaType_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "media_assets_entityType_entityId_mediaType_idx" ON public.media_assets USING btree ("entityType", "entityId", "mediaType");


--
-- Name: media_assets_mediaType_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "media_assets_mediaType_idx" ON public.media_assets USING btree ("mediaType");


--
-- Name: media_assets_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX media_assets_status_idx ON public.media_assets USING btree (status);


--
-- Name: media_assets_uploadedBy_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "media_assets_uploadedBy_idx" ON public.media_assets USING btree ("uploadedBy");


--
-- Name: service_addons_serviceId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_addons_serviceId_idx" ON public.service_addons USING btree ("serviceId");


--
-- Name: service_categories_isActive_isFeatured_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_categories_isActive_isFeatured_idx" ON public.service_categories USING btree ("isActive", "isFeatured");


--
-- Name: service_categories_level_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX service_categories_level_idx ON public.service_categories USING btree (level);


--
-- Name: service_categories_parentId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_categories_parentId_idx" ON public.service_categories USING btree ("parentId");


--
-- Name: service_categories_path_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX service_categories_path_idx ON public.service_categories USING btree (path);


--
-- Name: service_categories_slug_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX service_categories_slug_idx ON public.service_categories USING btree (slug);


--
-- Name: service_categories_slug_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX service_categories_slug_key ON public.service_categories USING btree (slug);


--
-- Name: service_packages_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_packages_artistId_idx" ON public.service_packages USING btree ("artistId");


--
-- Name: service_packages_isActive_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_packages_isActive_idx" ON public.service_packages USING btree ("isActive");


--
-- Name: service_pricing_serviceId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_pricing_serviceId_idx" ON public.service_pricing USING btree ("serviceId");


--
-- Name: service_pricing_serviceId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "service_pricing_serviceId_key" ON public.service_pricing USING btree ("serviceId");


--
-- Name: service_travel_rules_serviceId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "service_travel_rules_serviceId_idx" ON public.service_travel_rules USING btree ("serviceId");


--
-- Name: service_travel_rules_serviceId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "service_travel_rules_serviceId_key" ON public.service_travel_rules USING btree ("serviceId");


--
-- Name: services_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "services_artistId_idx" ON public.services USING btree ("artistId");


--
-- Name: services_artistId_slug_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "services_artistId_slug_key" ON public.services USING btree ("artistId", slug);


--
-- Name: services_categoryId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "services_categoryId_idx" ON public.services USING btree ("categoryId");


--
-- Name: services_cityId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "services_cityId_idx" ON public.services USING btree ("cityId");


--
-- Name: services_isMainService_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "services_isMainService_idx" ON public.services USING btree ("isMainService");


--
-- Name: services_pricingType_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "services_pricingType_idx" ON public.services USING btree ("pricingType");


--
-- Name: services_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX services_status_idx ON public.services USING btree (status);


--
-- Name: states_code_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX states_code_idx ON public.states USING btree (code);


--
-- Name: states_countryId_code_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "states_countryId_code_key" ON public.states USING btree ("countryId", code);


--
-- Name: states_countryId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "states_countryId_idx" ON public.states USING btree ("countryId");


--
-- Name: cities cities_stateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_addons service_addons_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_addons
    ADD CONSTRAINT "service_addons_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_categories service_categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT "service_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.service_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: service_pricing service_pricing_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_pricing
    ADD CONSTRAINT "service_pricing_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_travel_rules service_travel_rules_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.service_travel_rules
    ADD CONSTRAINT "service_travel_rules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: services services_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.service_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: states states_countryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES public.countries(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict VnZazw3JV2nS8uSKOtRqzVOsMxdoKxAczCp1mAxvbnP63OJxgTrYny6HpV2dNhJ

