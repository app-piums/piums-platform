--
-- PostgreSQL database dump
--

\restrict prnkxlilY3G5ycV0H0XYsiAw7ApiDdSov28BVDCtglHfXzzwB8ikMr8et9k5eQm

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
-- Name: BookingItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BookingItemType" AS ENUM (
    'BASE',
    'ADDON',
    'TRAVEL',
    'DISCOUNT'
);


ALTER TYPE public."BookingItemType" OWNER TO postgres;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PAYMENT_PENDING',
    'PAYMENT_COMPLETED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_CLIENT',
    'CANCELLED_ARTIST',
    'REJECTED',
    'NO_SHOW',
    'RESCHEDULED'
);


ALTER TYPE public."BookingStatus" OWNER TO postgres;

--
-- Name: DisputeResolution; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeResolution" AS ENUM (
    'FULL_REFUND',
    'PARTIAL_REFUND',
    'NO_REFUND',
    'CREDIT',
    'WARNING',
    'SUSPENSION',
    'BAN',
    'NO_ACTION'
);


ALTER TYPE public."DisputeResolution" OWNER TO postgres;

--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'OPEN',
    'IN_REVIEW',
    'AWAITING_INFO',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);


ALTER TYPE public."DisputeStatus" OWNER TO postgres;

--
-- Name: DisputeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeType" AS ENUM (
    'CANCELLATION',
    'QUALITY',
    'REFUND',
    'NO_SHOW',
    'ARTIST_NO_SHOW',
    'PRICING',
    'BEHAVIOR',
    'OTHER'
);


ALTER TYPE public."DisputeType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'DEPOSIT_PAID',
    'FULLY_PAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

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
-- Name: availability_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_configs (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "minAdvanceHours" integer DEFAULT 24 NOT NULL,
    "maxAdvanceDays" integer DEFAULT 90 NOT NULL,
    "bufferMinutes" integer DEFAULT 30 NOT NULL,
    "autoConfirm" boolean DEFAULT false NOT NULL,
    "requiresDeposit" boolean DEFAULT true NOT NULL,
    "cancellationHours" integer DEFAULT 48 NOT NULL,
    "cancellationFee" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.availability_configs OWNER TO postgres;

--
-- Name: availability_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_reservations (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "bookingId" text NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.availability_reservations OWNER TO postgres;

--
-- Name: blocked_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_slots (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    reason text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.blocked_slots OWNER TO postgres;

--
-- Name: booking_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_items (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    type public."BookingItemType" NOT NULL,
    name text NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    "unitPriceCents" integer NOT NULL,
    "totalPriceCents" integer NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_items OWNER TO postgres;

--
-- Name: booking_status_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_status_changes (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "fromStatus" public."BookingStatus",
    "toStatus" public."BookingStatus" NOT NULL,
    "changedBy" text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.booking_status_changes OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "artistId" text NOT NULL,
    "serviceId" text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "durationMinutes" integer NOT NULL,
    location text,
    "locationLat" double precision,
    "locationLng" double precision,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "servicePrice" integer NOT NULL,
    "addonsPrice" integer DEFAULT 0 NOT NULL,
    "totalPrice" integer NOT NULL,
    currency text DEFAULT 'GTQ'::text NOT NULL,
    "depositRequired" boolean DEFAULT false NOT NULL,
    "depositAmount" integer,
    "depositPaidAt" timestamp(3) without time zone,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paidAmount" integer DEFAULT 0 NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paymentMethod" text,
    "selectedAddons" text[],
    "clientNotes" text,
    "artistNotes" text,
    "internalNotes" text,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "cancellationReason" text,
    "refundAmount" integer,
    "confirmedAt" timestamp(3) without time zone,
    "confirmedBy" text,
    "reminderSent24h" boolean DEFAULT false NOT NULL,
    "reminderSent2h" boolean DEFAULT false NOT NULL,
    "reviewId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "paymentIntentId" text,
    code text,
    "quoteSnapshot" jsonb,
    "cityId" text,
    "paymentId" text,
    "rescheduleCount" integer DEFAULT 0 NOT NULL,
    "rescheduleReason" text,
    "rescheduledAt" timestamp(3) without time zone,
    "rescheduledBy" text,
    "eventId" text
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: dispute_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispute_messages (
    id text NOT NULL,
    "disputeId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderType" text NOT NULL,
    message text NOT NULL,
    attachments jsonb,
    "isStatusUpdate" boolean DEFAULT false NOT NULL,
    "oldStatus" public."DisputeStatus",
    "newStatus" public."DisputeStatus",
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.dispute_messages OWNER TO postgres;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputes (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "reportedBy" text NOT NULL,
    "reportedAgainst" text,
    "disputeType" public."DisputeType" NOT NULL,
    status public."DisputeStatus" DEFAULT 'OPEN'::public."DisputeStatus" NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    resolution public."DisputeResolution",
    "resolutionNotes" text,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    evidence jsonb,
    priority integer DEFAULT 0 NOT NULL,
    "refundAmount" integer,
    "refundIssued" boolean DEFAULT false NOT NULL,
    "refundIssuedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.disputes OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7e6475fc-dfa8-4600-866b-11751a438af8	b71314b4f4e1ebecb9ad19b430d7a53153e175bfb237d8eaac1749d3032bd12c	2026-03-25 15:28:58.338121-06	baseline		\N	2026-03-25 15:28:58.338121-06	0
\.


--
-- Data for Name: availability_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_configs (id, "artistId", "minAdvanceHours", "maxAdvanceDays", "bufferMinutes", "autoConfirm", "requiresDeposit", "cancellationHours", "cancellationFee", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: availability_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_reservations (id, "artistId", "bookingId", "startAt", "endAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: blocked_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocked_slots (id, "artistId", "startTime", "endTime", reason, "isRecurring", "createdAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: booking_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_items (id, "bookingId", type, name, qty, "unitPriceCents", "totalPriceCents", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_status_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_status_changes (id, "bookingId", "fromStatus", "toStatus", "changedBy", reason, "createdAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, "clientId", "artistId", "serviceId", "scheduledDate", "durationMinutes", location, "locationLat", "locationLng", status, "servicePrice", "addonsPrice", "totalPrice", currency, "depositRequired", "depositAmount", "depositPaidAt", "paymentStatus", "paidAmount", "paidAt", "paymentMethod", "selectedAddons", "clientNotes", "artistNotes", "internalNotes", "cancelledAt", "cancelledBy", "cancellationReason", "refundAmount", "confirmedAt", "confirmedBy", "reminderSent24h", "reminderSent2h", "reviewId", "createdAt", "updatedAt", "deletedAt", "paymentIntentId", code, "quoteSnapshot", "cityId", "paymentId", "rescheduleCount", "rescheduleReason", "rescheduledAt", "rescheduledBy", "eventId") FROM stdin;
\.


--
-- Data for Name: dispute_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispute_messages (id, "disputeId", "senderId", "senderType", message, attachments, "isStatusUpdate", "oldStatus", "newStatus", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disputes (id, "bookingId", "reportedBy", "reportedAgainst", "disputeType", status, subject, description, resolution, "resolutionNotes", "resolvedBy", "resolvedAt", evidence, priority, "refundAmount", "refundIssued", "refundIssuedAt", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: availability_configs availability_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_configs
    ADD CONSTRAINT availability_configs_pkey PRIMARY KEY (id);


--
-- Name: availability_reservations availability_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_reservations
    ADD CONSTRAINT availability_reservations_pkey PRIMARY KEY (id);


--
-- Name: blocked_slots blocked_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_slots
    ADD CONSTRAINT blocked_slots_pkey PRIMARY KEY (id);


--
-- Name: booking_items booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_items
    ADD CONSTRAINT booking_items_pkey PRIMARY KEY (id);


--
-- Name: booking_status_changes booking_status_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_status_changes
    ADD CONSTRAINT booking_status_changes_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: availability_configs_artistId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "availability_configs_artistId_key" ON public.availability_configs USING btree ("artistId");


--
-- Name: availability_reservations_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_reservations_artistId_idx" ON public.availability_reservations USING btree ("artistId");


--
-- Name: availability_reservations_artistId_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_reservations_artistId_startAt_endAt_idx" ON public.availability_reservations USING btree ("artistId", "startAt", "endAt");


--
-- Name: availability_reservations_bookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "availability_reservations_bookingId_key" ON public.availability_reservations USING btree ("bookingId");


--
-- Name: availability_reservations_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_reservations_startAt_endAt_idx" ON public.availability_reservations USING btree ("startAt", "endAt");


--
-- Name: blocked_slots_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "blocked_slots_artistId_idx" ON public.blocked_slots USING btree ("artistId");


--
-- Name: blocked_slots_startTime_endTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "blocked_slots_startTime_endTime_idx" ON public.blocked_slots USING btree ("startTime", "endTime");


--
-- Name: booking_items_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_items_bookingId_idx" ON public.booking_items USING btree ("bookingId");


--
-- Name: booking_items_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_items_type_idx ON public.booking_items USING btree (type);


--
-- Name: booking_status_changes_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_status_changes_bookingId_idx" ON public.booking_status_changes USING btree ("bookingId");


--
-- Name: booking_status_changes_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_status_changes_createdAt_idx" ON public.booking_status_changes USING btree ("createdAt");


--
-- Name: bookings_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_artistId_idx" ON public.bookings USING btree ("artistId");


--
-- Name: bookings_cityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_cityId_idx" ON public.bookings USING btree ("cityId");


--
-- Name: bookings_clientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_clientId_idx" ON public.bookings USING btree ("clientId");


--
-- Name: bookings_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_code_idx ON public.bookings USING btree (code);


--
-- Name: bookings_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bookings_code_key ON public.bookings USING btree (code);


--
-- Name: bookings_paymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_paymentId_idx" ON public.bookings USING btree ("paymentId");


--
-- Name: bookings_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_paymentStatus_idx" ON public.bookings USING btree ("paymentStatus");


--
-- Name: bookings_reviewId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bookings_reviewId_key" ON public.bookings USING btree ("reviewId");


--
-- Name: bookings_scheduledDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_scheduledDate_idx" ON public.bookings USING btree ("scheduledDate");


--
-- Name: bookings_serviceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_serviceId_idx" ON public.bookings USING btree ("serviceId");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: dispute_messages_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispute_messages_createdAt_idx" ON public.dispute_messages USING btree ("createdAt");


--
-- Name: dispute_messages_disputeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispute_messages_disputeId_idx" ON public.dispute_messages USING btree ("disputeId");


--
-- Name: dispute_messages_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispute_messages_senderId_idx" ON public.dispute_messages USING btree ("senderId");


--
-- Name: disputes_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disputes_bookingId_idx" ON public.disputes USING btree ("bookingId");


--
-- Name: disputes_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disputes_createdAt_idx" ON public.disputes USING btree ("createdAt");


--
-- Name: disputes_disputeType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disputes_disputeType_idx" ON public.disputes USING btree ("disputeType");


--
-- Name: disputes_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX disputes_priority_idx ON public.disputes USING btree (priority);


--
-- Name: disputes_reportedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disputes_reportedBy_idx" ON public.disputes USING btree ("reportedBy");


--
-- Name: disputes_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX disputes_status_idx ON public.disputes USING btree (status);


--
-- Name: booking_status_changes booking_status_changes_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_status_changes
    ADD CONSTRAINT "booking_status_changes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dispute_messages dispute_messages_disputeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES public.disputes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict prnkxlilY3G5ycV0H0XYsiAw7ApiDdSov28BVDCtglHfXzzwB8ikMr8et9k5eQm

