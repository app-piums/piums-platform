--
-- PostgreSQL database dump
--

\restrict qgAcczsDYCPicPZLSRyHAg1fKLxectkI6hlzARmZ0e4yNJIwaT56wxjgaNt564G

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
-- Name: PaymentIntentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentIntentStatus" AS ENUM (
    'CREATED',
    'REQUIRES_ACTION',
    'PROCESSING',
    'SUCCEEDED',
    'CANCELLED',
    'FAILED'
);


ALTER TYPE public."PaymentIntentStatus" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED',
    'PARTIALLY_REFUNDED',
    'FULLY_REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentType" AS ENUM (
    'DEPOSIT',
    'FULL_PAYMENT',
    'REMAINING',
    'REFUND'
);


ALTER TYPE public."PaymentType" OWNER TO postgres;

--
-- Name: PayoutStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayoutStatus" AS ENUM (
    'PENDING',
    'SCHEDULED',
    'PROCESSING',
    'IN_TRANSIT',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REVERSED'
);


ALTER TYPE public."PayoutStatus" OWNER TO postgres;

--
-- Name: PayoutType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayoutType" AS ENUM (
    'BOOKING_PAYMENT',
    'MANUAL',
    'ADJUSTMENT',
    'BONUS',
    'REFUND_REVERSAL'
);


ALTER TYPE public."PayoutType" OWNER TO postgres;

--
-- Name: RefundStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RefundStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."RefundStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: payment_intents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_intents (
    id text NOT NULL,
    "stripePaymentIntentId" text NOT NULL,
    "userId" text NOT NULL,
    "bookingId" text,
    amount integer NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    status public."PaymentIntentStatus" DEFAULT 'CREATED'::public."PaymentIntentStatus" NOT NULL,
    "clientSecret" text,
    "paymentMethods" text[],
    description text,
    metadata jsonb,
    "confirmedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment_intents OWNER TO postgres;

--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id text NOT NULL,
    "userId" text NOT NULL,
    "stripePaymentMethodId" text NOT NULL,
    type text NOT NULL,
    "cardBrand" text,
    "cardLast4" text,
    "cardExpMonth" integer,
    "cardExpYear" integer,
    "isDefault" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "bookingId" text,
    "stripePaymentIntentId" text,
    "stripeChargeId" text,
    amount integer NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    "amountReceived" integer,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    "paymentMethod" text,
    "paymentMethodDetails" jsonb,
    description text,
    metadata jsonb,
    "platformFee" integer,
    "stripeFee" integer,
    "paidAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "failureCode" text,
    "failureMessage" text,
    "refundedAmount" integer DEFAULT 0 NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payouts (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "bookingId" text,
    "paymentId" text,
    "stripeTransferId" text,
    "stripePayoutId" text,
    "stripeAccountId" text,
    amount integer NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    status public."PayoutStatus" DEFAULT 'PENDING'::public."PayoutStatus" NOT NULL,
    "payoutType" public."PayoutType" DEFAULT 'BOOKING_PAYMENT'::public."PayoutType" NOT NULL,
    "originalAmount" integer,
    "platformFee" integer,
    "stripeFee" integer,
    "scheduledFor" timestamp(3) without time zone,
    "processedAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "failureCode" text,
    "failureMessage" text,
    description text,
    metadata jsonb,
    "internalNotes" text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payouts OWNER TO postgres;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refunds (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    "stripeRefundId" text,
    "requestedBy" text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    status public."RefundStatus" DEFAULT 'PENDING'::public."RefundStatus" NOT NULL,
    reason text,
    metadata jsonb,
    "processedAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "failureReason" text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.refunds OWNER TO postgres;

--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_events (
    id text NOT NULL,
    "stripeEventId" text NOT NULL,
    "eventType" text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    error text,
    retries integer DEFAULT 0 NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.webhook_events OWNER TO postgres;

--
-- Data for Name: payment_intents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_intents (id, "stripePaymentIntentId", "userId", "bookingId", amount, currency, status, "clientSecret", "paymentMethods", description, metadata, "confirmedAt", "cancelledAt", "expiresAt", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, "userId", "stripePaymentMethodId", type, "cardBrand", "cardLast4", "cardExpMonth", "cardExpYear", "isDefault", metadata, "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, "userId", "bookingId", "stripePaymentIntentId", "stripeChargeId", amount, currency, "amountReceived", status, "paymentType", "paymentMethod", "paymentMethodDetails", description, metadata, "platformFee", "stripeFee", "paidAt", "failedAt", "failureCode", "failureMessage", "refundedAmount", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payouts (id, "artistId", "bookingId", "paymentId", "stripeTransferId", "stripePayoutId", "stripeAccountId", amount, currency, status, "payoutType", "originalAmount", "platformFee", "stripeFee", "scheduledFor", "processedAt", "failedAt", "failureCode", "failureMessage", description, metadata, "internalNotes", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refunds (id, "paymentId", "stripeRefundId", "requestedBy", amount, currency, status, reason, metadata, "processedAt", "failedAt", "failureReason", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_events (id, "stripeEventId", "eventType", payload, processed, "processedAt", error, retries, "deletedAt", "createdAt") FROM stdin;
\.


--
-- Name: payment_intents payment_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_intents
    ADD CONSTRAINT payment_intents_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: payment_intents_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payment_intents_bookingId_idx" ON public.payment_intents USING btree ("bookingId");


--
-- Name: payment_intents_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_intents_status_idx ON public.payment_intents USING btree (status);


--
-- Name: payment_intents_stripePaymentIntentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payment_intents_stripePaymentIntentId_idx" ON public.payment_intents USING btree ("stripePaymentIntentId");


--
-- Name: payment_intents_stripePaymentIntentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payment_intents_stripePaymentIntentId_key" ON public.payment_intents USING btree ("stripePaymentIntentId");


--
-- Name: payment_intents_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payment_intents_userId_idx" ON public.payment_intents USING btree ("userId");


--
-- Name: payment_methods_stripePaymentMethodId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payment_methods_stripePaymentMethodId_idx" ON public.payment_methods USING btree ("stripePaymentMethodId");


--
-- Name: payment_methods_stripePaymentMethodId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payment_methods_stripePaymentMethodId_key" ON public.payment_methods USING btree ("stripePaymentMethodId");


--
-- Name: payment_methods_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payment_methods_userId_idx" ON public.payment_methods USING btree ("userId");


--
-- Name: payments_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_bookingId_idx" ON public.payments USING btree ("bookingId");


--
-- Name: payments_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_createdAt_idx" ON public.payments USING btree ("createdAt");


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: payments_stripePaymentIntentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_stripePaymentIntentId_idx" ON public.payments USING btree ("stripePaymentIntentId");


--
-- Name: payments_stripePaymentIntentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON public.payments USING btree ("stripePaymentIntentId");


--
-- Name: payments_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_userId_idx" ON public.payments USING btree ("userId");


--
-- Name: payouts_artistId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payouts_artistId_idx" ON public.payouts USING btree ("artistId");


--
-- Name: payouts_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payouts_bookingId_idx" ON public.payouts USING btree ("bookingId");


--
-- Name: payouts_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payouts_createdAt_idx" ON public.payouts USING btree ("createdAt");


--
-- Name: payouts_paymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payouts_paymentId_idx" ON public.payouts USING btree ("paymentId");


--
-- Name: payouts_scheduledFor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payouts_scheduledFor_idx" ON public.payouts USING btree ("scheduledFor");


--
-- Name: payouts_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payouts_status_idx ON public.payouts USING btree (status);


--
-- Name: payouts_stripePayoutId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payouts_stripePayoutId_key" ON public.payouts USING btree ("stripePayoutId");


--
-- Name: payouts_stripeTransferId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payouts_stripeTransferId_key" ON public.payouts USING btree ("stripeTransferId");


--
-- Name: refunds_paymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "refunds_paymentId_idx" ON public.refunds USING btree ("paymentId");


--
-- Name: refunds_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refunds_status_idx ON public.refunds USING btree (status);


--
-- Name: refunds_stripeRefundId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "refunds_stripeRefundId_idx" ON public.refunds USING btree ("stripeRefundId");


--
-- Name: refunds_stripeRefundId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "refunds_stripeRefundId_key" ON public.refunds USING btree ("stripeRefundId");


--
-- Name: webhook_events_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "webhook_events_createdAt_idx" ON public.webhook_events USING btree ("createdAt");


--
-- Name: webhook_events_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "webhook_events_eventType_idx" ON public.webhook_events USING btree ("eventType");


--
-- Name: webhook_events_processed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhook_events_processed_idx ON public.webhook_events USING btree (processed);


--
-- Name: webhook_events_stripeEventId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "webhook_events_stripeEventId_idx" ON public.webhook_events USING btree ("stripeEventId");


--
-- Name: webhook_events_stripeEventId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "webhook_events_stripeEventId_key" ON public.webhook_events USING btree ("stripeEventId");


--
-- Name: refunds refunds_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict qgAcczsDYCPicPZLSRyHAg1fKLxectkI6hlzARmZ0e4yNJIwaT56wxjgaNt564G

