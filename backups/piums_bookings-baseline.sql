--
-- PostgreSQL database dump
--

\restrict thgVCwdvh7c5YtaUbw9eAdBfjInODe4on9xv7xQeRmjAsWxMILWq2l4g5qeW3Vq

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
-- Name: BookingItemType; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."BookingItemType" AS ENUM (
    'BASE',
    'ADDON',
    'TRAVEL',
    'DISCOUNT'
);


ALTER TYPE public."BookingItemType" OWNER TO piums;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PAYMENT_PENDING',
    'PAYMENT_COMPLETED',
    'IN_PROGRESS',
    'COMPLETED',
    'RESCHEDULED',
    'CANCELLED_CLIENT',
    'CANCELLED_ARTIST',
    'REJECTED',
    'NO_SHOW'
);


ALTER TYPE public."BookingStatus" OWNER TO piums;

--
-- Name: DisputeResolution; Type: TYPE; Schema: public; Owner: piums
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


ALTER TYPE public."DisputeResolution" OWNER TO piums;

--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'OPEN',
    'IN_REVIEW',
    'AWAITING_INFO',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);


ALTER TYPE public."DisputeStatus" OWNER TO piums;

--
-- Name: DisputeType; Type: TYPE; Schema: public; Owner: piums
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


ALTER TYPE public."DisputeType" OWNER TO piums;

--
-- Name: EventStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."EventStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."EventStatus" OWNER TO piums;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'DEPOSIT_PAID',
    'FULLY_PAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO piums;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: availability_configs; Type: TABLE; Schema: public; Owner: piums
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
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.availability_configs OWNER TO piums;

--
-- Name: availability_reservations; Type: TABLE; Schema: public; Owner: piums
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


ALTER TABLE public.availability_reservations OWNER TO piums;

--
-- Name: blocked_slots; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.blocked_slots (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    reason text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.blocked_slots OWNER TO piums;

--
-- Name: booking_items; Type: TABLE; Schema: public; Owner: piums
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


ALTER TABLE public.booking_items OWNER TO piums;

--
-- Name: booking_status_changes; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.booking_status_changes (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "fromStatus" public."BookingStatus",
    "toStatus" public."BookingStatus" NOT NULL,
    "changedBy" text NOT NULL,
    reason text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_status_changes OWNER TO piums;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    code text,
    "clientId" text NOT NULL,
    "artistId" text NOT NULL,
    "serviceId" text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "durationMinutes" integer NOT NULL,
    location text,
    "locationLat" double precision,
    "locationLng" double precision,
    "cityId" text,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "servicePrice" integer NOT NULL,
    "addonsPrice" integer DEFAULT 0 NOT NULL,
    "totalPrice" integer NOT NULL,
    currency text DEFAULT 'GTQ'::text NOT NULL,
    "quoteSnapshot" jsonb,
    "depositRequired" boolean DEFAULT false NOT NULL,
    "depositAmount" integer,
    "depositPaidAt" timestamp(3) without time zone,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentIntentId" text,
    "paymentId" text,
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
    "rescheduledAt" timestamp(3) without time zone,
    "rescheduledBy" text,
    "rescheduleReason" text,
    "rescheduleCount" integer DEFAULT 0 NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "confirmedBy" text,
    "reminderSent24h" boolean DEFAULT false NOT NULL,
    "reminderSent2h" boolean DEFAULT false NOT NULL,
    "reviewId" text,
    "eventId" text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bookings OWNER TO piums;

--
-- Name: dispute_messages; Type: TABLE; Schema: public; Owner: piums
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


ALTER TABLE public.dispute_messages OWNER TO piums;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: piums
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


ALTER TABLE public.disputes OWNER TO piums;

--
-- Name: events; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.events (
    id text NOT NULL,
    code text NOT NULL,
    "clientId" text NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    "locationLat" double precision,
    "locationLng" double precision,
    notes text,
    "eventDate" timestamp(3) without time zone,
    status public."EventStatus" DEFAULT 'DRAFT'::public."EventStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.events OWNER TO piums;

--
-- Data for Name: availability_configs; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.availability_configs (id, "artistId", "minAdvanceHours", "maxAdvanceDays", "bufferMinutes", "autoConfirm", "requiresDeposit", "cancellationHours", "cancellationFee", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: availability_reservations; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.availability_reservations (id, "artistId", "bookingId", "startAt", "endAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: blocked_slots; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.blocked_slots (id, "artistId", "startTime", "endTime", reason, "isRecurring", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_items; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.booking_items (id, "bookingId", type, name, qty, "unitPriceCents", "totalPriceCents", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_status_changes; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.booking_status_changes (id, "bookingId", "fromStatus", "toStatus", "changedBy", reason, "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.bookings (id, code, "clientId", "artistId", "serviceId", "scheduledDate", "durationMinutes", location, "locationLat", "locationLng", "cityId", status, "servicePrice", "addonsPrice", "totalPrice", currency, "quoteSnapshot", "depositRequired", "depositAmount", "depositPaidAt", "paymentStatus", "paymentIntentId", "paymentId", "paidAmount", "paidAt", "paymentMethod", "selectedAddons", "clientNotes", "artistNotes", "internalNotes", "cancelledAt", "cancelledBy", "cancellationReason", "refundAmount", "rescheduledAt", "rescheduledBy", "rescheduleReason", "rescheduleCount", "confirmedAt", "confirmedBy", "reminderSent24h", "reminderSent2h", "reviewId", "eventId", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dispute_messages; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.dispute_messages (id, "disputeId", "senderId", "senderType", message, attachments, "isStatusUpdate", "oldStatus", "newStatus", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.disputes (id, "bookingId", "reportedBy", "reportedAgainst", "disputeType", status, subject, description, resolution, "resolutionNotes", "resolvedBy", "resolvedAt", evidence, priority, "refundAmount", "refundIssued", "refundIssuedAt", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.events (id, code, "clientId", name, description, location, "locationLat", "locationLng", notes, "eventDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: availability_configs availability_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.availability_configs
    ADD CONSTRAINT availability_configs_pkey PRIMARY KEY (id);


--
-- Name: availability_reservations availability_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.availability_reservations
    ADD CONSTRAINT availability_reservations_pkey PRIMARY KEY (id);


--
-- Name: blocked_slots blocked_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.blocked_slots
    ADD CONSTRAINT blocked_slots_pkey PRIMARY KEY (id);


--
-- Name: booking_items booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.booking_items
    ADD CONSTRAINT booking_items_pkey PRIMARY KEY (id);


--
-- Name: booking_status_changes booking_status_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.booking_status_changes
    ADD CONSTRAINT booking_status_changes_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: availability_configs_artistId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "availability_configs_artistId_key" ON public.availability_configs USING btree ("artistId");


--
-- Name: availability_reservations_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "availability_reservations_artistId_idx" ON public.availability_reservations USING btree ("artistId");


--
-- Name: availability_reservations_artistId_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "availability_reservations_artistId_startAt_endAt_idx" ON public.availability_reservations USING btree ("artistId", "startAt", "endAt");


--
-- Name: availability_reservations_bookingId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "availability_reservations_bookingId_key" ON public.availability_reservations USING btree ("bookingId");


--
-- Name: availability_reservations_startAt_endAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "availability_reservations_startAt_endAt_idx" ON public.availability_reservations USING btree ("startAt", "endAt");


--
-- Name: blocked_slots_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "blocked_slots_artistId_idx" ON public.blocked_slots USING btree ("artistId");


--
-- Name: blocked_slots_startTime_endTime_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "blocked_slots_startTime_endTime_idx" ON public.blocked_slots USING btree ("startTime", "endTime");


--
-- Name: booking_items_bookingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "booking_items_bookingId_idx" ON public.booking_items USING btree ("bookingId");


--
-- Name: booking_items_type_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX booking_items_type_idx ON public.booking_items USING btree (type);


--
-- Name: booking_status_changes_bookingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "booking_status_changes_bookingId_idx" ON public.booking_status_changes USING btree ("bookingId");


--
-- Name: booking_status_changes_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "booking_status_changes_createdAt_idx" ON public.booking_status_changes USING btree ("createdAt");


--
-- Name: bookings_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_artistId_idx" ON public.bookings USING btree ("artistId");


--
-- Name: bookings_cityId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_cityId_idx" ON public.bookings USING btree ("cityId");


--
-- Name: bookings_clientId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_clientId_idx" ON public.bookings USING btree ("clientId");


--
-- Name: bookings_code_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX bookings_code_idx ON public.bookings USING btree (code);


--
-- Name: bookings_code_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX bookings_code_key ON public.bookings USING btree (code);


--
-- Name: bookings_paymentId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_paymentId_idx" ON public.bookings USING btree ("paymentId");


--
-- Name: bookings_paymentStatus_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_paymentStatus_idx" ON public.bookings USING btree ("paymentStatus");


--
-- Name: bookings_reviewId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "bookings_reviewId_key" ON public.bookings USING btree ("reviewId");


--
-- Name: bookings_scheduledDate_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_scheduledDate_idx" ON public.bookings USING btree ("scheduledDate");


--
-- Name: bookings_serviceId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "bookings_serviceId_idx" ON public.bookings USING btree ("serviceId");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: dispute_messages_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "dispute_messages_createdAt_idx" ON public.dispute_messages USING btree ("createdAt");


--
-- Name: dispute_messages_disputeId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "dispute_messages_disputeId_idx" ON public.dispute_messages USING btree ("disputeId");


--
-- Name: dispute_messages_senderId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "dispute_messages_senderId_idx" ON public.dispute_messages USING btree ("senderId");


--
-- Name: disputes_bookingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "disputes_bookingId_idx" ON public.disputes USING btree ("bookingId");


--
-- Name: disputes_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "disputes_createdAt_idx" ON public.disputes USING btree ("createdAt");


--
-- Name: disputes_disputeType_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "disputes_disputeType_idx" ON public.disputes USING btree ("disputeType");


--
-- Name: disputes_priority_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX disputes_priority_idx ON public.disputes USING btree (priority);


--
-- Name: disputes_reportedBy_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "disputes_reportedBy_idx" ON public.disputes USING btree ("reportedBy");


--
-- Name: disputes_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX disputes_status_idx ON public.disputes USING btree (status);


--
-- Name: events_clientId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "events_clientId_idx" ON public.events USING btree ("clientId");


--
-- Name: events_code_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX events_code_key ON public.events USING btree (code);


--
-- Name: events_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX events_status_idx ON public.events USING btree (status);


--
-- Name: booking_status_changes booking_status_changes_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.booking_status_changes
    ADD CONSTRAINT "booking_status_changes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dispute_messages dispute_messages_disputeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES public.disputes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict thgVCwdvh7c5YtaUbw9eAdBfjInODe4on9xv7xQeRmjAsWxMILWq2l4g5qeW3Vq

