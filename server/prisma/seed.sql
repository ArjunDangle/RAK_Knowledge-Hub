--
-- PostgreSQL database dump
--

\restrict eTfhDINd6WnWVhabmrzskAGcHYKmMh8ub8mq3Lg7gKo2t9OOXzXuvHnltDkcaRo

-- Dumped from database version 15.14
-- Dumped by pg_dump version 18.0

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
-- Data for Name: Page; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Page" VALUES (1, '1690927115', 'Resource Centre', 'resource-centre', 'Comprehensive knowledge base and documentation', 'SUBSECTION', NULL, 'Shivam Tripathi', 0, '2025-11-14 05:23:59.667');
INSERT INTO public."Page" VALUES (2, '1691451420', 'New Hire Onboarding', 'new-hire-onboarding', 'Choose your Role To provide you with more precise learning content and resource recommendations, please select the role that best matches your curr...', 'SUBSECTION', '1690927115', 'Shivam Tripathi', 0, '2025-11-14 05:20:27.355');
INSERT INTO public."Page" VALUES (3, '1691090950', 'How To', 'how-to', 'User Manuals provide step-by-step instructions for setting up, configuring, and operating RakWireless products. They are designed to ensure custome...', 'SUBSECTION', '1690927115', 'Shivam Tripathi', 0, '2025-11-14 05:21:12.781');
INSERT INTO public."Page" VALUES (4, '1690304524', 'Tech Support', 'tech-support', 'Technical Support is where customers and staff can find troubleshooting guides, FAQs, and escalation procedures. It ensures issues are resolved qui...', 'SUBSECTION', '1690927115', 'Shivam Tripathi', 0, '2025-11-14 05:21:49.635');
INSERT INTO public."Page" VALUES (5, '1690501132', 'Case Studies', 'case-studies', 'The Case Studies section highlights real-world deployments of RakWireless technology across different industries. These examples showcase how our p...', 'SUBSECTION', '1690927115', 'Shivam Tripathi', 0, '2025-11-14 05:23:29.16');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."User" VALUES (1, 'admin', 'Sibi John', '$2b$12$TMQecnLrL28j4Bg63RRdKe.6a6ssD4qX.BrASj7FK4ZM59.8TURxi', 'ADMIN', '2025-11-14 05:46:04.164');
INSERT INTO public."User" VALUES (2, 'member', 'Arjun Dangle', '$2b$12$MkpNVEGASD2xdsEicrtmQeNc8U5h2TprRRjWuIGV87t/2wXKcaZQu', 'MEMBER', '2025-11-14 05:46:08.193');


--
-- Data for Name: ArticleSubmission; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: TagGroup; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _GroupToUser; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _PageToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('16be628a-cd7a-4c57-9eb6-8373d87cbe78', 'ba4cd30c1f4af819d332dabf8ec5605bf5ea8fbd64b4fa117c801b2ab3a4c1cf', '2025-11-14 11:00:59.999403+05:30', '20251029143312_init', NULL, NULL, '2025-11-14 11:00:59.943978+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('abbd7b0f-78bd-4633-9fbb-16cdd6e7a140', '2db460b4bd44e31d5eccf6701ca524e23c118d11422534acaef96992031e1fc4', '2025-11-14 11:01:00.027914+05:30', '20251031095440_add_notification_table', NULL, NULL, '2025-11-14 11:01:00.003288+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('5b9ab069-3336-47c1-8ab1-ed604b1329af', '2a611cb69ecb04260d99b0d179a2a739337b9c3162908456f8c8656a256d8d83', '2025-11-14 11:01:00.091616+05:30', '20251103141517_add_page_and_tag_models', NULL, NULL, '2025-11-14 11:01:00.032363+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('55563253-4be2-4eeb-aef4-865f318d6798', '925fc6c82cc223d9d1bd97cf3fda7e7baac2f3c8b97200ea9f00ce1dcce7809f', '2025-11-14 11:01:00.1295+05:30', '20251107122021_add_group_permissions', NULL, NULL, '2025-11-14 11:01:00.095161+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('ff95744b-8c73-4ede-9cd2-9f4a5ec7cb0e', 'fca5af86a70e3cbd580d7110d9193a72d1175bb344f52761a7a33442cfe63906', '2025-11-14 11:01:00.146887+05:30', '20251113131209_add_tag_groups', NULL, NULL, '2025-11-14 11:01:00.130863+05:30', 1);


--
-- Name: ArticleSubmission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ArticleSubmission_id_seq"', 1, false);


--
-- Name: Group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Group_id_seq"', 1, false);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);


--
-- Name: Page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Page_id_seq"', 5, true);


--
-- Name: TagGroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TagGroup_id_seq"', 1, false);


--
-- Name: Tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tag_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- PostgreSQL database dump complete
--

\unrestrict eTfhDINd6WnWVhabmrzskAGcHYKmMh8ub8mq3Lg7gKo2t9OOXzXuvHnltDkcaRo

