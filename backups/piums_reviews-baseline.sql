--
-- PostgreSQL database dump
--

\restrict IScKBfca1L5RtXPhGlZZ0ZFqUVlpbsEncvav8e5LsYytHgA3yg3PhvY8RlNmj3R

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
-- Name: ReportReason; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ReportReason" AS ENUM (
    'SPAM',
    'OFFENSIVE',
    'FAKE',
    'INAPPROPRIATE',
    'OTHER'
);


ALTER TYPE public."ReportReason" OWNER TO piums;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'PENDING',
    'REVIEWED',
    'RESOLVED',
    'DISMISSED'
);


ALTER TYPE public."ReportStatus" OWNER TO piums;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: piums
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'HIDDEN'
);


ALTER TYPE public."ReviewStatus" OWNER TO piums;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artist_ratings; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.artist_ratings (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "rating1Count" integer DEFAULT 0 NOT NULL,
    "rating2Count" integer DEFAULT 0 NOT NULL,
    "rating3Count" integer DEFAULT 0 NOT NULL,
    "rating4Count" integer DEFAULT 0 NOT NULL,
    "rating5Count" integer DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "totalWithComment" integer DEFAULT 0 NOT NULL,
    "totalWithPhotos" integer DEFAULT 0 NOT NULL,
    "responseRate" double precision DEFAULT 0 NOT NULL,
    "lastCalculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.artist_ratings OWNER TO piums;

--
-- Name: report_messages; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.report_messages (
    id text NOT NULL,
    "reportId" text NOT NULL,
    "senderType" text NOT NULL,
    "senderId" text,
    message text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.report_messages OWNER TO piums;

--
-- Name: review_photos; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.review_photos (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    url text NOT NULL,
    caption text,
    "order" integer DEFAULT 0 NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.review_photos OWNER TO piums;

--
-- Name: review_reports; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.review_reports (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    "reportedBy" text NOT NULL,
    reason public."ReportReason" NOT NULL,
    description text,
    status public."ReportStatus" DEFAULT 'PENDING'::public."ReportStatus" NOT NULL,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    resolution text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.review_reports OWNER TO piums;

--
-- Name: review_responses; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.review_responses (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    "artistId" text NOT NULL,
    message text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.review_responses OWNER TO piums;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: piums
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "bookingId" text,
    "clientId" text NOT NULL,
    "artistId" text NOT NULL,
    "serviceId" text,
    rating integer NOT NULL,
    comment text,
    status public."ReviewStatus" DEFAULT 'APPROVED'::public."ReviewStatus" NOT NULL,
    "helpfulCount" integer DEFAULT 0 NOT NULL,
    "notHelpfulCount" integer DEFAULT 0 NOT NULL,
    "isVerified" boolean DEFAULT true NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO piums;

--
-- Data for Name: artist_ratings; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.artist_ratings (id, "artistId", "averageRating", "rating1Count", "rating2Count", "rating3Count", "rating4Count", "rating5Count", "totalReviews", "totalWithComment", "totalWithPhotos", "responseRate", "lastCalculatedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: report_messages; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.report_messages (id, "reportId", "senderType", "senderId", message, "createdAt") FROM stdin;
\.


--
-- Data for Name: review_photos; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.review_photos (id, "reviewId", url, caption, "order", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: review_reports; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.review_reports (id, "reviewId", "reportedBy", reason, description, status, "resolvedBy", "resolvedAt", resolution, "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: review_responses; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.review_responses (id, "reviewId", "artistId", message, "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: piums
--

COPY public.reviews (id, "bookingId", "clientId", "artistId", "serviceId", rating, comment, status, "helpfulCount", "notHelpfulCount", "isVerified", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: artist_ratings artist_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.artist_ratings
    ADD CONSTRAINT artist_ratings_pkey PRIMARY KEY (id);


--
-- Name: report_messages report_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.report_messages
    ADD CONSTRAINT report_messages_pkey PRIMARY KEY (id);


--
-- Name: review_photos review_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_photos
    ADD CONSTRAINT review_photos_pkey PRIMARY KEY (id);


--
-- Name: review_reports review_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_pkey PRIMARY KEY (id);


--
-- Name: review_responses review_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: artist_ratings_artistId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "artist_ratings_artistId_key" ON public.artist_ratings USING btree ("artistId");


--
-- Name: report_messages_reportId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "report_messages_reportId_idx" ON public.report_messages USING btree ("reportId");


--
-- Name: review_photos_reviewId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "review_photos_reviewId_idx" ON public.review_photos USING btree ("reviewId");


--
-- Name: review_reports_reportedBy_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "review_reports_reportedBy_idx" ON public.review_reports USING btree ("reportedBy");


--
-- Name: review_reports_reviewId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "review_reports_reviewId_idx" ON public.review_reports USING btree ("reviewId");


--
-- Name: review_reports_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX review_reports_status_idx ON public.review_reports USING btree (status);


--
-- Name: review_responses_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "review_responses_artistId_idx" ON public.review_responses USING btree ("artistId");


--
-- Name: review_responses_reviewId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "review_responses_reviewId_key" ON public.review_responses USING btree ("reviewId");


--
-- Name: reviews_artistId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "reviews_artistId_idx" ON public.reviews USING btree ("artistId");


--
-- Name: reviews_bookingId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "reviews_bookingId_idx" ON public.reviews USING btree ("bookingId");


--
-- Name: reviews_bookingId_key; Type: INDEX; Schema: public; Owner: piums
--

CREATE UNIQUE INDEX "reviews_bookingId_key" ON public.reviews USING btree ("bookingId");


--
-- Name: reviews_clientId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "reviews_clientId_idx" ON public.reviews USING btree ("clientId");


--
-- Name: reviews_createdAt_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "reviews_createdAt_idx" ON public.reviews USING btree ("createdAt");


--
-- Name: reviews_rating_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX reviews_rating_idx ON public.reviews USING btree (rating);


--
-- Name: reviews_serviceId_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX "reviews_serviceId_idx" ON public.reviews USING btree ("serviceId");


--
-- Name: reviews_status_idx; Type: INDEX; Schema: public; Owner: piums
--

CREATE INDEX reviews_status_idx ON public.reviews USING btree (status);


--
-- Name: report_messages report_messages_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.report_messages
    ADD CONSTRAINT "report_messages_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public.review_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review_photos review_photos_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_photos
    ADD CONSTRAINT "review_photos_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review_reports review_reports_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review_responses review_responses_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: piums
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IScKBfca1L5RtXPhGlZZ0ZFqUVlpbsEncvav8e5LsYytHgA3yg3PhvY8RlNmj3R

