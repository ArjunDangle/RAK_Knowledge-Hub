--
-- PostgreSQL database dump
--

\restrict onmmhOKxmfn2D1hNBRkAQkxSTRjiWBJdmL6BamAbBaXyDqKw8xhw4DRctHGuPPf

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

INSERT INTO public."Page" VALUES (1, '1397489708', 'Resource Centre', 'resource-centre', 'A centralized hub where employees can access documentation, templates, tools, and knowledge to work efficiently across RakWireless.', 'SUBSECTION', NULL, 'India Team', 0, '2025-09-03 11:09:04.497');
INSERT INTO public."Page" VALUES (2, '1399291924', 'New Hire Onboarding', 'new-hire-onboarding', 'Choose your Role To provide you with more precise learning content and resource recommendations, please select the role that best matches your current work', 'SUBSECTION', '1397489708', 'India Team', 0, '2025-09-18 15:56:00.179');
INSERT INTO public."Page" VALUES (3, '1446182957', 'Developer', 'developer', 'Software developer related positiions', 'SUBSECTION', '1399291924', 'India Team', 0, '2025-09-18 09:47:36.452');
INSERT INTO public."Page" VALUES (4, '1444773982', 'Front-End Developer', 'front-end-developer', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182957', 'Shivam Tripathi', 0, '2025-09-18 09:58:18.699');
INSERT INTO public."Page" VALUES (5, '1457946657', 'Week 1 - Front End Developer', 'week-1---front-end-developer', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'SUBSECTION', '1444773982', 'India Team', 0, '2025-09-18 09:20:05.15');
INSERT INTO public."Page" VALUES (6, '1460142084', 'OpenWrt Developer Guide: Understanding OpenWrt Compilation System', 'openwrt-developer-guide-understanding-openwrt-compilation-system', 'This is the OpenWrt developer guide https://openwrt.org/docs/guide-developer/start . Completing this chapter will give you a basic understanding of the entire OpenWrt compilation system.', 'ARTICLE', '1457946657', 'Shivam Tripathi', 0, '2025-09-18 16:06:21.892');
INSERT INTO public."Page" VALUES (7, '1460174929', 'Test block', 'test-block', 'This is a test block', 'ARTICLE', '1457946657', 'Shivam Tripathi', 0, '2025-09-18 20:11:22.39');
INSERT INTO public."Page" VALUES (8, '1457717295', 'Week 2 - Front End Developer', 'week-2---front-end-developer', 'Skill Learning In-depth learning of core job-related skills', 'SUBSECTION', '1444773982', 'India Team', 0, '2025-09-18 09:20:44.247');
INSERT INTO public."Page" VALUES (9, '1489240070', 'Demo page for content', 'demo-page-for-content', 'Submitted by: Shivam Tripathi This is the demo page for week 2 of developers No relevant image for this page.', 'ARTICLE', '1457717295', 'Shivam Tripathi', 0, '2025-09-29 04:41:44.128');
INSERT INTO public."Page" VALUES (10, '1458077742', 'Week 3 - Front End Developer', 'week-3---front-end-developer', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1444773982', 'India Team', 0, '2025-09-18 09:21:08.52');
INSERT INTO public."Page" VALUES (11, '1458077751', 'Week 4 - Front End Developer', 'week-4---front-end-developer', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1444773982', 'India Team', 0, '2025-09-18 09:21:23.209');
INSERT INTO public."Page" VALUES (12, '1445298226', 'Back-End Developer', 'back-end-developer', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182957', 'India Team', 0, '2025-09-18 09:28:49.299');
INSERT INTO public."Page" VALUES (13, '1459191809', 'Week 1 - Back End Developer', 'week-1---back-end-developer', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'ARTICLE', '1445298226', 'India Team', 0, '2025-09-18 09:22:49.482');
INSERT INTO public."Page" VALUES (14, '1459224577', 'Week 2 - Back End Developer', 'week-2---back-end-developer', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1445298226', 'India Team', 0, '2025-09-18 09:24:49.152');
INSERT INTO public."Page" VALUES (15, '1459257345', 'Week 3 - Back End Developer', 'week-3---back-end-developer', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1445298226', 'India Team', 0, '2025-09-18 09:25:48.688');
INSERT INTO public."Page" VALUES (16, '1459191819', 'Week 4 - Back End Developer', 'week-4---back-end-developer', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1445298226', 'India Team', 0, '2025-09-18 09:28:04.555');
INSERT INTO public."Page" VALUES (17, '1520435237', 'Test bro', 'test-bro', 'Submitted by: Arjun Dangle Test page tro', 'ARTICLE', '1445298226', 'Shivam Tripathi', 0, '2025-10-06 14:41:38.859');
INSERT INTO public."Page" VALUES (18, '1445298235', 'Platform Developer', 'platform-developer', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182957', 'India Team', 0, '2025-09-18 09:31:16.156');
INSERT INTO public."Page" VALUES (19, '1459290113', 'Week 1 - Platform Developer', 'week-1---platform-developer', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'SUBSECTION', '1445298235', 'India Team', 0, '2025-09-18 09:34:58.319');
INSERT INTO public."Page" VALUES (20, '1462665245', 'Test OPENWRT', 'test-openwrt', 'This is the OpenWrt developer guide https://openwrt.org/docs/guide-developer/start . Completing this chapter will give you a basic understanding of the entire OpenWrt compilation system.', 'ARTICLE', '1459290113', 'Shivam Tripathi', 0, '2025-09-19 04:19:10.922');
INSERT INTO public."Page" VALUES (21, '1459322881', 'Week 2 - Platform Developer', 'week-2---platform-developer', 'Skill Learning In-depth learning of core job-related skills', 'SUBSECTION', '1445298235', 'India Team', 0, '2025-09-18 09:38:05.97');
INSERT INTO public."Page" VALUES (22, '1674379267', 'THIS IS ANOTHER CONTENT FOR PLATFORM DEVELOPER IN WEEK 2', 'this-is-another-content-for-platform-developer-in-week-2', 'Submitted by: Arjun Dangle THIS IS ANOTHER CONTENT FOR PLATFORM DEVELOPER IN WEEK 2THIS IS ANOTHER CONTENT FOR PLATFORM DEVELOPER IN WEEK 2THIS IS ANOTHER CONTENT FOR PLATFORM DEVELOPER IN WEEK 2THIS IS ANOTHER CONTENT FOR PLATFORM DEVELOPER IN WEEK ...', 'ARTICLE', '1459322881', 'Shivam Tripathi', 0, '2025-11-10 15:38:27.473');
INSERT INTO public."Page" VALUES (23, '1459224587', 'Week 3 - Platform Developer', 'week-3---platform-developer', 'Practical Operations Practice learned skills through real projects', 'SUBSECTION', '1445298235', 'India Team', 0, '2025-09-18 09:38:38.497');
INSERT INTO public."Page" VALUES (24, '1463025669', 'Making a Customized OpenWrt-based Image for RAK v2 Gateways', 'making-a-customized-openwrt-based-image-for-rak-v2-gateways', 'No description available.', 'ARTICLE', '1459224587', 'Shivam Tripathi', 0, '2025-09-19 04:27:26.35');
INSERT INTO public."Page" VALUES (25, '1459191829', 'Week 4 - Platform Developer', 'week-4---platform-developer', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1445298235', 'India Team', 0, '2025-09-18 09:39:27.052');
INSERT INTO public."Page" VALUES (26, '1444970562', 'BSP Developer', 'bsp-developer', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182957', 'India Team', 0, '2025-09-18 09:43:17.331');
INSERT INTO public."Page" VALUES (27, '1459290123', 'Week 1 - BSP Developer', 'week-1---bsp-developer', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'SUBSECTION', '1444970562', 'India Team', 0, '2025-09-18 09:40:45.6');
INSERT INTO public."Page" VALUES (28, '1674313729', 'BSP DEVELOPER WEEK 1 CONTENT', 'bsp-developer-week-1-content', 'Submitted by: Arjun Dangle Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First steps into the ChirpStack OS WebUI Access via DHCP Access via WiFi AP Default credentials Change the default credentials Other setting...', 'ARTICLE', '1459290123', 'Shivam Tripathi', 0, '2025-11-10 14:18:47.132');
INSERT INTO public."Page" VALUES (29, '1459388417', 'Week 2 - BSP Developer', 'week-2---bsp-developer', 'Skill Learning In-depth learning of core job-related skills', 'SUBSECTION', '1444970562', 'India Team', 0, '2025-09-18 09:41:19.1');
INSERT INTO public."Page" VALUES (30, '1674149892', 'THIS IS A CONTENT FOR BSP WEEK 2 CONTENT', 'this-is-a-content-for-bsp-week-2-content', 'Submitted by: Arjun Dangle (venv) shivam@00132-IN-TECH-LAP-MAC server % uvicorn app.main:app --reload INFO:     Will watch for changes in these directories: [''/Users/shivam/Desktop/RAK_Knowledge-Hub/server''] INFO:     Uvicorn running on http://127.0....', 'ARTICLE', '1459388417', 'Shivam Tripathi', 0, '2025-11-10 14:35:43.478');
INSERT INTO public."Page" VALUES (31, '1459191839', 'Week 3 - BSP Developer', 'week-3---bsp-developer', 'Practical Operations Practice learned skills through real projects', 'SUBSECTION', '1444970562', 'India Team', 0, '2025-09-18 09:41:58.629');
INSERT INTO public."Page" VALUES (32, '1677262874', 'BSP WEEK 3 CONTENT #1', 'bsp-week-3-content-1', 'Submitted by: Arjun Dangle Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First steps into the ChirpStack OS WebUI Access via DHCP Access via WiFi AP Default credentials Change the default credentials Other setting...', 'ARTICLE', '1459191839', 'Shivam Tripathi', 0, '2025-11-11 14:30:49.613');
INSERT INTO public."Page" VALUES (33, '1459191849', 'Week 4 - BSP Developer', 'week-4---bsp-developer', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1444970562', 'India Team', 0, '2025-09-18 09:42:42.042');
INSERT INTO public."Page" VALUES (34, '1446084639', 'Application Developer', 'application-developer', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182957', 'India Team', 0, '2025-09-18 09:43:40.433');
INSERT INTO public."Page" VALUES (35, '1459388427', 'Week 1 - Application Developer', 'week-1---application-developer', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'ARTICLE', '1446084639', 'India Team', 0, '2025-09-18 09:44:11.622');
INSERT INTO public."Page" VALUES (36, '1459290133', 'Week 2 - Application Developer', 'week-2---application-developer', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1446084639', 'India Team', 0, '2025-09-18 09:49:03.233');
INSERT INTO public."Page" VALUES (37, '1459191859', 'Week 3 - Application Developer', 'week-3---application-developer', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1446084639', 'India Team', 0, '2025-09-18 09:49:35.97');
INSERT INTO public."Page" VALUES (38, '1459224597', 'Week 4 - Application Developer', 'week-4---application-developer', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1446084639', 'India Team', 0, '2025-09-18 09:50:14.566');
INSERT INTO public."Page" VALUES (39, '1446182978', 'Tester', 'tester', 'Software and hardware testing related positions', 'SUBSECTION', '1399291924', 'Shivam Tripathi', 0, '2025-09-15 11:32:46.617');
INSERT INTO public."Page" VALUES (40, '1444741201', 'Software Tester', 'software-tester', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182978', 'India Team', 0, '2025-09-18 09:56:24.312');
INSERT INTO public."Page" VALUES (41, '1459191869', 'Week 1 - Software Tester', 'week-1---software-tester', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'ARTICLE', '1444741201', 'India Team', 0, '2025-09-18 09:59:18.847');
INSERT INTO public."Page" VALUES (42, '1459388437', 'Week 2 - Software Tester', 'week-2---software-tester', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1444741201', 'India Team', 0, '2025-09-18 10:00:02.123');
INSERT INTO public."Page" VALUES (43, '1459388447', 'Week 3 - Software Tester', 'week-3---software-tester', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1444741201', 'India Team', 0, '2025-09-18 10:00:37.388');
INSERT INTO public."Page" VALUES (44, '1459191879', 'Week 4 - Software Tester', 'week-4---software-tester', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1444741201', 'India Team', 0, '2025-09-18 10:01:18.354');
INSERT INTO public."Page" VALUES (45, '1445888072', 'Hardware Tester', 'hardware-tester', 'Learning Plan for New Employees Carefully designed 4-week learning path to progressively master core job skills', 'SUBSECTION', '1446182978', 'India Team', 0, '2025-09-18 09:56:56.736');
INSERT INTO public."Page" VALUES (46, '1459388457', 'Week 1 - Hardware Tester', 'week-1---hardware-tester', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'SUBSECTION', '1445888072', 'India Team', 0, '2025-09-18 10:12:48.463');
INSERT INTO public."Page" VALUES (47, '1461846023', 'RAK7437 BACnet Gateway', 'rak7437-bacnet-gateway', 'RAK Gateway PDF', 'ARTICLE', '1459388457', 'India Team', 0, '2025-09-19 03:51:13.163');
INSERT INTO public."Page" VALUES (48, '1459191889', 'Week 2 - Hardware Tester', 'week-2---hardware-tester', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1445888072', 'India Team', 0, '2025-09-18 10:17:58.727');
INSERT INTO public."Page" VALUES (49, '1459224617', 'Week 3 - Hardware Tester', 'week-3---hardware-tester', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1445888072', 'India Team', 0, '2025-09-18 10:20:28.877');
INSERT INTO public."Page" VALUES (50, '1459617793', 'Week 4 - Hardware Tester', 'week-4---hardware-tester', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1445888072', 'India Team', 0, '2025-09-18 10:22:52.335');
INSERT INTO public."Page" VALUES (51, '1445298260', 'Technical Support', 'technical-support', 'Responsible for customer technical support and product assistance', 'SUBSECTION', '1399291924', 'Shivam Tripathi', 0, '2025-09-15 11:35:52.512');
INSERT INTO public."Page" VALUES (52, '1459191909', 'Week 1 - Technical Support', 'week-1---technical-support', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'ARTICLE', '1445298260', 'India Team', 0, '2025-09-18 10:48:24.967');
INSERT INTO public."Page" VALUES (53, '1459191919', 'Week 2 - Technical Support', 'week-2---technical-support', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1445298260', 'India Team', 0, '2025-09-18 10:49:17.02');
INSERT INTO public."Page" VALUES (54, '1459650561', 'Week 3 - Technical Support', 'week-3---technical-support', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1445298260', 'India Team', 0, '2025-09-18 10:50:04.088');
INSERT INTO public."Page" VALUES (55, '1459683329', 'Week 4 - Technical Support', 'week-4---technical-support', 'Advanced Development Deepen understanding and learn advanced skills', 'ARTICLE', '1445298260', 'India Team', 0, '2025-09-18 10:50:40.868');
INSERT INTO public."Page" VALUES (56, '1444282525', 'Sales & BD', 'sales-bd', 'Responsible for product sales and business development', 'SUBSECTION', '1399291924', 'Shivam Tripathi', 0, '2025-09-15 11:36:28.739');
INSERT INTO public."Page" VALUES (57, '1459388467', 'Week 1 -Sales & BD', 'week-1--sales-bd', 'Foundation & Introduction Understanding basic job knowledge and company culture', 'ARTICLE', '1444282525', 'India Team', 0, '2025-09-18 10:51:54.944');
INSERT INTO public."Page" VALUES (58, '1459191929', 'Week 2 - Sales & BD', 'week-2---sales-bd', 'Skill Learning In-depth learning of core job-related skills', 'ARTICLE', '1444282525', 'India Team', 0, '2025-09-18 10:52:25.246');
INSERT INTO public."Page" VALUES (59, '1459716097', 'Week 3 - Sales & BD', 'week-3---sales-bd', 'Practical Operations Practice learned skills through real projects', 'ARTICLE', '1444282525', 'India Team', 0, '2025-09-18 10:58:21.346');
INSERT INTO public."Page" VALUES (60, '1459224627', 'Week 4 - Sales & BD', 'week-4---sales-bd', 'Advanced Development Deepen understanding and learn advanced skills', 'SUBSECTION', '1444282525', 'India Team', 0, '2025-09-18 10:58:57.436');
INSERT INTO public."Page" VALUES (61, '1464500225', 'INTL-Onboarding Process and 90 days'' Plan Template', 'intl-onboarding-process-and-90-days-plan-template', '👋 Welcome to RAKwireless Dear <employee name> We''re glad you''re here! We''ve put together this onboarding plan to help you get up to speed in your new role as a  on . Feel free to reach out if you have any questions 🙂 - Here are some links which can g...', 'ARTICLE', '1459224627', 'Shivam Tripathi', 0, '2025-09-22 10:32:06.551');
INSERT INTO public."Page" VALUES (62, '1444774003', 'All Staff', 'all-staff', 'Knowledge Base Documents Browse all related documents and resources by category', 'SUBSECTION', '1399291924', 'India Team', 0, '2025-09-18 11:14:35.198');
INSERT INTO public."Page" VALUES (63, '1458831403', 'Company', 'company', 'Here, we provide essential company guidelines and resources to support our team members in their roles. Our guidelines are designed to foster a collaborative and innovative work environment, ensuring that everyone adheres to our core values and princ...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:28:32.812');
INSERT INTO public."Page" VALUES (64, '1458077783', 'Hand Book', 'hand-book', 'Welcome to the Hand Book. This document serves as a comprehensive guide designed to provide essential information, resources, and guidelines to help you navigate through various processes and practices. Whether you are seeking clarity on policies, pr...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:27:04.82');
INSERT INTO public."Page" VALUES (65, '1457782848', 'People Group', 'people-group', 'People Group This page provides an overview of various people groups, highlighting their unique characteristics, cultures, and contributions to society. It aims to foster understanding and appreciation of the diversity that exists within human popula...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:20:47.84');
INSERT INTO public."Page" VALUES (66, '1457455171', 'Engineering', 'engineering', 'Engineering This engineering page serves as a comprehensive resource within the Knowledge Hub, designed to provide valuable insights, tools, and information for engineers and technical professionals. Here, you will find a wealth of knowledge covering...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:22:15.529');
INSERT INTO public."Page" VALUES (160, '1423802434', 'RAK11300', 'rak11300', 'The RAK11300 WisDuo LPWAN Module is based on the Raspberry Pi RP2040 chip and SX1262 RF transceiver.', 'SUBSECTION', '1423409164', 'India Team', 0, '2025-09-09 08:30:30.746');
INSERT INTO public."Page" VALUES (67, '1457946713', 'Security', 'security', 'This security page serves as a comprehensive resource for understanding and implementing best practices in information security. It aims to equip users with essential knowledge on safeguarding sensitive data, recognizing potential threats, and adheri...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:24:08.981');
INSERT INTO public."Page" VALUES (68, '1458077792', 'Marketing', 'marketing', 'Welcome to our marketing page, where innovation meets strategy! Here, we showcase our cutting-edge solutions designed to elevate your brand and engage your audience. Explore our diverse range of services tailored to meet your unique needs, and discov...', 'ARTICLE', '1444774003', 'India Team', 0, '2025-09-18 11:24:54.445');
INSERT INTO public."Page" VALUES (69, '1445888088', 'Demo - PDF and Video Rendering', 'demo---pdf-and-video-rendering', 'This is the above content This is the below content 1.1 How to login to myIMS3.0 portal.mp4 This is the content below video', 'ARTICLE', '1399291924', 'India Team', 0, '2025-09-19 03:54:30.474');
INSERT INTO public."Page" VALUES (70, '1641152531', 'wwwww', 'wwwww', 'Submitted by: Yinxing Li abcggggggggggggggggggggggggggggyuuuuuuuuuuuuuuuu', 'SUBSECTION', '1399291924', 'Shivam Tripathi', 0, '2025-11-04 03:47:24.798');
INSERT INTO public."Page" VALUES (71, '1643413512', 'hdhiehreifhfrojoi rf', 'hdhiehreifhfrojoi-rf', 'Submitted by: Yinxing Li gggggggggggggggggggggghhhhhhhhhhhhhhhhhhhhggggggggggggggggggggg', 'ARTICLE', '1641152531', 'Shivam Tripathi', 0, '2025-11-04 03:57:58.566');
INSERT INTO public."Page" VALUES (72, '1398898696', 'How To', 'how-to', 'User Manuals provide step-by-step instructions for setting up, configuring, and operating RakWireless products. They are designed to ensure customers can maximize product performance with minimal effort.', 'SUBSECTION', '1397489708', 'India Team', 0, '2025-09-09 08:57:13.989');
INSERT INTO public."Page" VALUES (73, '1395294224', 'Get Started with RakWireless', 'get-started-with-rakwireless', 'Unsure Where to Start? Let Us Guide You! Not sure if RAKwireless is a great fit for you? Visit the RAKwireless Site to learn what solutions we offer and why you should choose RAKwireless for your IOT and technology needs. If you haven’t already selec...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-09-03 12:51:35.215');
INSERT INTO public."Page" VALUES (74, '1394966569', 'Connect RAK Gateways to Chirpstack v4 via UDP', 'connect-rak-gateways-to-chirpstack-v4-via-udp', 'How to Connect RAK Gateways to Chirpstack v4 via UDP Prerequisites Before configuring the connection, make sure the following conditions are met: A deployed ChirpStack v4 Network Server. Open the following ports on your ChirpStack server: UDP 1700 fo...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-09-09 06:50:42.289');
INSERT INTO public."Page" VALUES (75, '1394507801', 'Connect RAK Gateways to TTN v3 Using Basics™ Station (LNS)', 'connect-rak-gateways-to-ttn-v3-using-basics-station-lns', 'How to Connect RAK Gateways to TTN v3 Using Basics™ Station (LNS) This guide explains how to connect a RAK gateway to The Things Network (TTN) v3 using Basics™ Station with LNS for secure TLS-based LoRaWAN® data communication. Prerequisites Before st...', 'ARTICLE', '1398898696', 'India Team', 0, '2025-09-02 09:34:54.307');
INSERT INTO public."Page" VALUES (76, '1616936966', 'Page not showing up error', 'page-not-showing-up-error', 'Submitted by: Shivam Tripathi Your browser does not support the HTML5 video element', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 09:53:55.518');
INSERT INTO public."Page" VALUES (77, '1616805892', 'new page for attachment issue test', 'new-page-for-attachment-issue-test', 'Submitted by: Shivam Tripathi PDF: Image: Video: Your browser does not support the HTML5 video element', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 10:07:21.596');
INSERT INTO public."Page" VALUES (78, '1615855621', 'DB updates checking', 'db-updates-checking', 'Submitted by: Shivam Tripathi just to check if this page is reviewed instantly or not', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 11:50:37.685');
INSERT INTO public."Page" VALUES (79, '1618837506', 'Content test', 'content-test', 'Submitted by: Shivam Tripathi Image: Video: Your browser does not support the HTML5 video element', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 13:29:21.422');
INSERT INTO public."Page" VALUES (80, '1619427330', 'content testing for the attachment', 'content-testing-for-the-attachment', 'Submitted by: Sibi John PDF: Image: Video:', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 14:39:55.409');
INSERT INTO public."Page" VALUES (81, '1619492866', 'test4', 'test4', 'Submitted by: Sibi John', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-29 14:50:05.787');
INSERT INTO public."Page" VALUES (82, '1625489410', 'Inserting an image', 'inserting-an-image', 'Submitted by: Shivam Tripathi I will insert an image here for testing. ohsgfouhwGROUHASGRHAIUSRHGIAEWHRGOho;h;o 1.1 How to login to myIMS3.0 portal.mp4', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-30 14:00:56.737');
INSERT INTO public."Page" VALUES (83, '1626177537', 'attachment test again', 'attachment-test-again', 'Submitted by: Sibi John This is where the test image will be added so that we can check it', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-30 14:13:51.965');
INSERT INTO public."Page" VALUES (84, '1625423891', 'Eureka', 'eureka', 'Submitted by: Sibi John How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access via...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-30 15:15:35.213');
INSERT INTO public."Page" VALUES (85, '1630175246', 'How to meow', 'how-to-meow', 'Submitted by: Member User How to meow in english, spanish, hindi, marathi, meow', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 10:26:22.597');
INSERT INTO public."Page" VALUES (86, '1629618197', 'meow meow 2', 'meow-meow-2', 'Submitted by: Member User how to meow again and again and again fluently', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 10:34:31.768');
INSERT INTO public."Page" VALUES (87, '1630339108', 'admin notification test', 'admin-notification-test', 'Submitted by: Member User checking admin notifcation feature leyt it work amen', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 10:45:46.725');
INSERT INTO public."Page" VALUES (88, '1631387649', 'Direct from website', 'direct-from-website', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 13:17:25.278');
INSERT INTO public."Page" VALUES (89, '1631158278', 'directly from google docs', 'directly-from-google-docs', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 13:18:20.018');
INSERT INTO public."Page" VALUES (90, '1631322115', 'directly from google docs 23', 'directly-from-google-docs-23', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 13:24:32.357');
INSERT INTO public."Page" VALUES (91, '1631748097', 'Website content paste test', 'website-content-paste-test', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 13:33:40.681');
INSERT INTO public."Page" VALUES (92, '1631289347', 'Google docs content pasted', 'google-docs-content-pasted', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-10-31 13:34:20.944');
INSERT INTO public."Page" VALUES (185, '1399390229', 'Sales & Marketing', 'sales-marketing', 'The Sales and Marketing team drives growth by positioning RakWireless products, running campaigns, and building strong customer relationships.', 'SUBSECTION', '1400340498', 'Shivam Tripathi', 0, '2025-09-03 12:38:23.565');
INSERT INTO public."Page" VALUES (93, '1631256595', 'website to confluence', 'website-to-confluence', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-01 04:37:19.532');
INSERT INTO public."Page" VALUES (94, '1631223844', 'docs to confluence', 'docs-to-confluence', 'Submitted by: Arjun Dangle How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-01 04:38:10.983');
INSERT INTO public."Page" VALUES (95, '1633550354', 'test content for my test', 'test-content-for-my-test', 'Submitted by: Sibi John ohOAHROBWovuba;iwurbv;iuBV;IUBV;IBVw;ibv;iubw;ibvib;rbv;airbviu', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-02 05:08:21.381');
INSERT INTO public."Page" VALUES (96, '1636171791', 'THis is a test page for tags', 'this-is-a-test-page-for-tags', 'Submitted by: Sibi John NO hsaiudfgisaubgisrbgiaefiyagfiaiabfiabfibaivbklasbiawbsbgjabisybbSiesbirbiwga', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-03 12:45:28.172');
INSERT INTO public."Page" VALUES (97, '1641316377', 'Test of India team for attachment', 'test-of-india-team-for-attachment', 'Submitted by: Sibi John How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access via...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-04 10:23:38.871');
INSERT INTO public."Page" VALUES (98, '1641283595', 'test page by india team for attachment', 'test-page-by-india-team-for-attachment', 'Submitted by: Sibi John How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access via...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-04 10:25:01.807');
INSERT INTO public."Page" VALUES (99, '1649770510', 'Testing page creation in DB architecture', 'testing-page-creation-in-db-architecture', 'Submitted by: Sibi John How to Set Up Gateway Mesh - Quick Start Using ChirpStackOS on RAK Gateways In This Article Table of Contents Solution Architecture Supported Hardware Installing ChirpStackOS First Steps Into the ChirpStack OS WebUI Access via...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 12:11:55.731');
INSERT INTO public."Page" VALUES (100, '1653604354', '713913y513058103 Test article', '713913y513058103-test-article', 'Submitted by: Sibi John Thjoafngoasgoargojsr vsaojnrjojbnaornboan sngoineraognseog agnsrwargnjerbgaegaerg', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 12:52:50.918');
INSERT INTO public."Page" VALUES (101, '1653997569', 'Test article 1984891374018', 'test-article-1984891374018', 'Submitted by: Sibi John Change the Default Credentials Once logged in, the first time you will be asked to set a more secure password and you certainly should do it. Just follow the button in the yellow banner to go directly to the set password page ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 12:59:29.351');
INSERT INTO public."Page" VALUES (102, '1654128642', '1234567890 test', '1234567890-test', 'Submitted by: Sibi John gshtstshtsjjdjydjudjudjydjudjydjy ydyjdjyrdjydjtryrdjtydjydjtr Video: 1.1 How to login to myIMS3.0 portal.mp4', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 14:02:05.241');
INSERT INTO public."Page" VALUES (103, '1654128664', '1234567890 Testing', '1234567890-testing', 'Submitted by: Sibi John qwertyuiopasdfghjkl Image:', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 14:04:02.406');
INSERT INTO public."Page" VALUES (104, '1653604371', 'qwagrfwrgaergteg', 'qwagrfwrgaergteg', 'Submitted by: Sibi John asgehtsrhsrthwrhtwhrthrthwhw', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-05 14:18:47.837');
INSERT INTO public."Page" VALUES (105, '1660878851', 'This is ia test page tha tis neing osagnaonrgNRGIwbgriw', 'this-is-ia-test-page-tha-tis-neing-osagnaonrgnrgiwbgriw', 'Submitted by: Sibi John sadhfdyfsiughiasbrgiabsri gvhanighiashnxgiuhnvinoachrnginuahgiuohvaoiuncgh this is meow', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-06 14:13:58.539');
INSERT INTO public."Page" VALUES (106, '1667104773', 'This is a test content as the bsp developer', 'this-is-a-test-content-as-the-bsp-developer', 'Submitted by: Arjun Dangle qwertyuioplkjhdsazxcvbnmkiujnbvrtyu87654323456789iugfcxertyhbv There are 3 sub-tabs in this page: Global configuration : check the enable checkbox to enable the MQTT forwarder for the gateway-mesh. MQTT configuration : the ...', 'ARTICLE', '1398898696', 'Shivam Tripathi', 0, '2025-11-07 14:43:57.19');
INSERT INTO public."Page" VALUES (107, '1399914501', 'Tech Support', 'tech-support', 'Technical Support is where customers and staff can find troubleshooting guides, FAQs, and escalation procedures. It ensures issues are resolved quickly while maintaining service reliability.', 'SUBSECTION', '1397489708', 'Shivam Tripathi', 0, '2025-09-15 11:35:41.553');
INSERT INTO public."Page" VALUES (108, '1425866753', 'Product Categories', 'product-categories', 'Explore the different product families inside RakWireless.', 'SUBSECTION', '1399914501', 'India Team', 0, '2025-09-09 06:41:48.368');
INSERT INTO public."Page" VALUES (109, '1399390219', 'WisBlock Docs', 'wisblock-docs', 'WisBlock is an impressive product by RAK for the IoT industry. Its modular design allows users to easily assemble solutions, facilitating the integration of low power wide area network (LPWAN) into IoT applications.', 'SUBSECTION', '1425866753', 'India Team', 0, '2025-09-09 08:54:06.278');
INSERT INTO public."Page" VALUES (110, '1425932302', 'RAK19007', 'rak19007', 'WisBlock Base Board with full-size layout for Core, sensor, interface, and power modules. Supports battery or USB supply, enabling flexible IoT prototyping and reliable modular expansion projects.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:02:13.676');
INSERT INTO public."Page" VALUES (111, '1425178674', 'Product Overview - RAK19007', 'product-overview---rak19007', 'Product Description RAK19007 is a WisBlock Base Board 2nd Gen that connects WisBlock Core , WisBlock IO , and WisBlock Modules . It provides the power supply and interconnection to the modules attached to it. It has one slot reserved for the WisBlock...', 'ARTICLE', '1425932302', 'Shivam Tripathi', 0, '2025-09-09 07:52:48.322');
INSERT INTO public."Page" VALUES (112, '1424031815', 'Quick Start Guide - RAK19007', 'quick-start-guide---rak19007', 'RAK19007 WisBlock Base Board 2nd Gen Quick Start Guide This guide introduces the RAK19007 WisBlock Base Board 2nd Gen and how to use it. Prerequisite What Do You Need? Before going through each and every step on using the WisBlock Base Board 2nd Gen,...', 'ARTICLE', '1425932302', 'Shivam Tripathi', 0, '2025-09-09 07:57:43.138');
INSERT INTO public."Page" VALUES (113, '1424621603', 'Datasheet - RAK19007', 'datasheet---rak19007', 'Overview Description RAK19007 is a WisBlock Base Board 2nd Gen that connects WisBlock Core , WisBlock IO , and WisBlock Modules . It provides the power supply and interconnection to the modules attached to it. It has one slot reserved for the WisBloc...', 'ARTICLE', '1425932302', 'Shivam Tripathi', 0, '2025-09-09 07:59:20.182');
INSERT INTO public."Page" VALUES (114, '1424523301', 'RAK19003', 'rak19003', 'WisBlock Base Board (compact version), smaller than RAK19007, designed for power-efficient or space-limited projects. Supports WisBlock Core modules, sensor boards, and interface boards for IoT prototyping.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:03:25.824');
INSERT INTO public."Page" VALUES (115, '1424621612', 'Product Overview - RAK19003', 'product-overview---rak19003', 'Product Description RAK19003 is a WisBlock Base board that connects WisBlock Core and WisBlock Modules . It provides the power supply and interconnection to the modules attached to it. It has one slot reserved for the WisBlock Core module and two Slo...', 'ARTICLE', '1424523301', 'Shivam Tripathi', 0, '2025-09-09 08:01:27.211');
INSERT INTO public."Page" VALUES (116, '1423802403', 'Quickstart Guide - RAK19003', 'quickstart-guide---rak19003', 'This guide introduces the RAK19003 WisBlock Base Board and how to use it. Prerequisite What Do You Need? Before going through each and every step on using the RAK19003 WisBlock Mini Base Board, make sure to prepare the necessary items listed below: H...', 'ARTICLE', '1424523301', 'Shivam Tripathi', 0, '2025-09-09 08:02:38.1');
INSERT INTO public."Page" VALUES (117, '1425178684', 'Datasheet - RAK19003', 'datasheet---rak19003', 'Overview Description RAK19003 WisBlock Mini Base module is the new main board that allows you to attach WisBlock modules through the standardized expansion connectors. In addition, the WisBlock Mini Base module also comprises a Type-C USB connector, ...', 'ARTICLE', '1424523301', 'Shivam Tripathi', 0, '2025-09-09 08:03:51.879');
INSERT INTO public."Page" VALUES (118, '1423802412', 'RAK4631', 'rak4631', 'WisBlock Core Module featuring Nordic nRF52840 MCU with SX1262 LoRa® transceiver. Supports LoRaWAN® and BLE communication, ideal for building wireless IoT applications with WisBlock ecosystem.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:03:53.546');
INSERT INTO public."Page" VALUES (119, '1424621641', 'Product Overview - RAK4631', 'product-overview---rak4631', 'Product Description RAK4631 is a WisBlock Core module for RAK WisBlock . It extends the WisBlock series with a powerful Nordic nRF52840 MCU that supports Bluetooth 5.0 (Bluetooth Low Energy) and the newest LoRa transceiver from Semtech, the SX1262. T...', 'ARTICLE', '1423802412', 'Shivam Tripathi', 0, '2025-09-09 08:15:28.574');
INSERT INTO public."Page" VALUES (120, '1424130091', 'Quick Start Guide - RAK4631', 'quick-start-guide---rak4631', 'This guide introduces the RAK4631 WisBlock Core LoRaWAN Module and how to use it. RAK4631 consists of an nRF52840 MCU and an SX1262 LoRa chip making it ideal for various IoT projects. Prerequisite Before going through each and every step on using RAK...', 'ARTICLE', '1423802412', 'Shivam Tripathi', 0, '2025-09-09 08:17:36.657');
INSERT INTO public."Page" VALUES (121, '1424883747', 'Datasheet - RAK4631', 'datasheet---rak4631', 'Overview Description The RAK4631 WisBlock Core module is a RAK4630 stamp module with an expansion PCB and connectors compatible with the RAK5005-O baseboard. It allows an easy way to access to the pins of the RAK4630 module in order to simplify devel...', 'ARTICLE', '1423802412', 'Shivam Tripathi', 0, '2025-09-09 08:24:55.695');
INSERT INTO public."Page" VALUES (122, '1423507503', 'RAK3372', 'rak3372', 'STM32WLE5-based LoRaWAN® Module in compact form factor. Integrates MCU and transceiver, suitable for embedding directly in custom hardware for energy-efficient IoT end-device deployments.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:05:13.03');
INSERT INTO public."Page" VALUES (123, '1425047622', 'Product Overview - RAK3372', 'product-overview---rak3372', 'Product Description The RAK3372 WisBlock Core module is a RAK3172 LoRa module with an expansion PCB and connectors compatible with the WisBlock Base. It allows an easy way to access the pins of the RAK3172 module, simplifying development and testing ...', 'ARTICLE', '1423507503', 'Shivam Tripathi', 0, '2025-09-09 08:27:39.788');
INSERT INTO public."Page" VALUES (124, '1423212596', 'Quick Start Guide - RAK3372', 'quick-start-guide---rak3372', 'Prerequisite Package Inclusions Before going through each and every step on using RAK3372 WisBlock Core, make sure to prepare the necessary items listed below: Hardware RAK3372 WisBlock Core Your choice of WisBlock Base USB Cable Li-Ion/LiPo battery ...', 'ARTICLE', '1423507503', 'Shivam Tripathi', 0, '2025-09-09 08:28:51.621');
INSERT INTO public."Page" VALUES (125, '1425178757', 'Datasheet - RAK3372', 'datasheet---rak3372', 'Description The RAK3372 WisBlock Core module is a RAK3172 LoRa module with an expansion PCB and connectors compatible with the WisBlock Base Boards. It allows an easy way to access the pins of the RAK3172 module, simplifying development and testing p...', 'ARTICLE', '1423507503', 'Shivam Tripathi', 0, '2025-09-09 08:30:07.182');
INSERT INTO public."Page" VALUES (126, '1423310899', 'RAK1901', 'rak1901', 'WisBlock Sensor Module featuring Sensirion SHTC3 for precise temperature and humidity monitoring. Enables energy-efficient environmental sensing in IoT projects when paired with WisBlock Core.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:05:40.174');
INSERT INTO public."Page" VALUES (127, '1423900729', 'Product Overview - RAK1901', 'product-overview---rak1901', 'Product Description RAK1901 is a WisBlock Sensor which extends the WisBlock system with a Sensirion SHTC3 temperature and humidity sensor. A ready to use SW library and tutorial makes it easy to build up an environmental temperature and humidity data...', 'ARTICLE', '1423310899', 'Shivam Tripathi', 0, '2025-09-09 08:31:47.105');
INSERT INTO public."Page" VALUES (128, '1423212605', 'Quick Start Guide - RAK1901', 'quick-start-guide---rak1901', 'Prerequisite What Do You Need? Before going through each and every step on using the RAK1901 WisBlock module, make sure to prepare the necessary items listed below: Hardware RAK1901 WisBlock Temperature & Humidity Sensor Your choice of WisBlock Base ...', 'ARTICLE', '1423310899', 'Shivam Tripathi', 0, '2025-09-09 08:32:56.917');
INSERT INTO public."Page" VALUES (129, '1424523322', 'Datasheet - RAK1901', 'datasheet---rak1901', 'Overview Figure 1: RAK1901 WisBlock Sensor Description RAK1901 is a WisBlock Sensor that extends the WisBlock system with a Sensirion SHTC3 temperature and humidity sensor. A ready-to-use SW library and tutorial make it easy to build up an environmen...', 'ARTICLE', '1423310899', 'Shivam Tripathi', 0, '2025-09-09 08:33:35');
INSERT INTO public."Page" VALUES (130, '1425834002', 'RAK1906', 'rak1906', 'WisBlock Sensor Module with Bosch BME680 for environmental sensing. Measures temperature, humidity, pressure, and gas, supporting air quality monitoring in versatile WisBlock IoT applications.', 'SUBSECTION', '1399390219', 'Shivam Tripathi', 0, '2025-09-09 09:06:19.324');
INSERT INTO public."Page" VALUES (131, '1424523331', 'Product Overview - RAK1906', 'product-overview---rak1906', 'Product Description The RAK1906 WisBlock Environmental Sensor Module, part of the RAK WisBlock Sensor series, is a 4-in-1 digital sensor board that comprises gas, humidity, pressure, and temperature sensor, based on the Bosch® BME680 module. The RAK1...', 'ARTICLE', '1425834002', 'Shivam Tripathi', 0, '2025-09-09 08:35:12.497');
INSERT INTO public."Page" VALUES (132, '1424850960', 'Quick Start Guide - RAK1906', 'quick-start-guide---rak1906', 'Prerequisite What Do You Need? Before going through each and every step on using the RAK1906 WisBlock module, make sure to prepare the necessary items listed below: Hardware RAK1906 WisBlock Environmental Sensor Module Your choice of WisBlock Base Yo...', 'ARTICLE', '1425834002', 'Shivam Tripathi', 0, '2025-09-09 08:36:03.344');
INSERT INTO public."Page" VALUES (133, '1423802468', 'Datasheet - RAK1906', 'datasheet---rak1906', 'Overview Figure 1: RAK1906 WisBlock Environmental Sensor Description The RAK1906 WisBlock Environmental Sensor Module, part of the RAK WisBlock Sensor series, is a 4-in-1 digital sensor board that comprises gas, humidity pressure, and temperature sen...', 'ARTICLE', '1425834002', 'Shivam Tripathi', 0, '2025-09-09 08:36:44.206');
INSERT INTO public."Page" VALUES (134, '1400864788', 'WisGate Docs', 'wisgate-docs', 'WisGate is a product line by RAK, serving as the network backbone with cost-efficient LPWAN gateway solutions functioning as LPWAN base stations with various backhaul connectivity options, categorized into indoor and outdoor gateways.', 'SUBSECTION', '1425866753', 'India Team', 0, '2025-09-09 08:55:45.62');
INSERT INTO public."Page" VALUES (135, '1425145925', 'RAK7268V2/RAK726V2', 'rak7268v2rak726v2', 'A compact indoor LoRaWAN® gateway designed for stable connectivity and easy deployment in controlled environments.', 'SUBSECTION', '1400864788', 'Shivam Tripathi', 0, '2025-09-09 10:19:20.522');
INSERT INTO public."Page" VALUES (136, '1424261162', 'Product Overview - RAK7268V2/RAK7268CV2', 'product-overview---rak7268v2rak7268cv2', 'Product Description The RAK7268V2 / RAK7268CV2 WisGate Edge Lite 2 is part of the RAK Edge Series , offering flexible connectivity options to meet the needs of a wide range of IoT (Internet of Things) applications. Designed for indoor use , this gate...', 'ARTICLE', '1425145925', 'Shivam Tripathi', 0, '2025-09-09 08:42:28.538');
INSERT INTO public."Page" VALUES (137, '1424588855', 'Quick Start Guide - RAK7268V2/RAK7268CV2', 'quick-start-guide---rak7268v2rak7268cv2', 'Prerequisites RAK7268V2/RAK7268CV2 WisGate Edge Lite 2 Ethernet Cable (RJ-45 Port) for Ethernet connection A Windows/MacOS/Linux Computer Installation Accessories (e.g., mounting kit, power supply, screws, etc.) NanoSIM Card (for LTE version) – If yo...', 'ARTICLE', '1425145925', 'Shivam Tripathi', 0, '2025-09-09 08:44:54.671');
INSERT INTO public."Page" VALUES (138, '1423671358', 'Datasheet - RAK7268V2/RAK7268CV2', 'datasheet---rak7268v2rak7268cv2', 'Description The RAK7268V2 / RAK7268CV2 WisGate Edge Lite 2 is part of the RAK Edge Series , offering flexible connectivity options to meet the needs of a wide range of IoT applications. Designed for indoor use , this gateway simplifies deployment wit...', 'ARTICLE', '1425145925', 'Shivam Tripathi', 0, '2025-09-09 08:46:20.256');
INSERT INTO public."Page" VALUES (139, '1426194447', 'RAK7289V2/RAK7289CV2', 'rak7289v2rak7289cv2', 'A rugged outdoor LoRaWAN® gateway offering long-range coverage and reliable performance in industrial and field conditions.', 'SUBSECTION', '1400864788', 'India Team', 0, '2025-09-09 09:00:37.216');
INSERT INTO public."Page" VALUES (140, '1423310929', 'Product Overview - RAK7289V2/RAK7289CV2', 'product-overview---rak7289v2rak7289cv2', 'Product Description The RAK7289V2 WisGate Edge Pro is the flagship product of the RAK Edge Series. Featuring industrial-grade components, it ensures a high level of reliability. It supports up to 16 LoRa channels and offers multi-backhaul options wit...', 'ARTICLE', '1426194447', 'Shivam Tripathi', 0, '2025-09-09 08:49:06.274');
INSERT INTO public."Page" VALUES (141, '1424326708', 'Quick Start Guide - RAK7289V2/RAK7289CV2', 'quick-start-guide---rak7289v2rak7289cv2', 'This manual provides brief instructions for installing and deploying the gateway. Prerequisites Hardware RAK7289V2/RAK7289CV2 WisGate Edge Pro Ethernet Cable (RJ-45 Port) for Ethernet connection A Windows/Mac OS/Linux Computer Installation Accessorie...', 'ARTICLE', '1426194447', 'Shivam Tripathi', 0, '2025-09-09 08:49:38.909');
INSERT INTO public."Page" VALUES (142, '1423638633', 'Datasheet - RAK7289V2/RAK7289CV2', 'datasheet---rak7289v2rak7289cv2', 'Description The RAK7289V2 WisGate Edge Pro is the flagship product of the RAK Edge Series. Featuring industrial-grade components, it ensures a high level of reliability. It supports up to 16 LoRa channels and offers multi-backhaul options with Ethern...', 'ARTICLE', '1426194447', 'Shivam Tripathi', 0, '2025-09-09 08:50:19.224');
INSERT INTO public."Page" VALUES (143, '1423868020', 'RAK7248', 'rak7248', 'A developer gateway optimized for testing and prototyping, enabling quick validation of LoRaWAN® solutions.', 'SUBSECTION', '1400864788', 'India Team', 0, '2025-09-09 09:00:54.397');
INSERT INTO public."Page" VALUES (144, '1425113164', 'Product Overview - RAK7248', 'product-overview---rak7248', 'Product Background The RAK7248 WisGate Developer D4H is a LoRaWAN® Gateway that consists of Raspberry Pi4, RAK2287 Concentrator, and RAK2287 Pi HAT. The RAK7248C D4H has a cellular and a PoE variant. The RAK7248C WisGate Developer D4H is the cellular...', 'ARTICLE', '1423868020', 'Shivam Tripathi', 0, '2025-09-09 08:52:56.267');
INSERT INTO public."Page" VALUES (145, '1424293941', 'Quick Start Guide - RAK7248', 'quick-start-guide---rak7248', 'Prerequisites What Do You Need? RAK7248/RAK7248C/RAK7248P WisGate Developer D4H Gateway 16 GB SD Card + Card Reader 5 V at least 2.5 A Micro USB Power Supply A Windows/Mac OS/Linux Computer Latest RAK7248 Firmware What''s Included in the Package? Figu...', 'ARTICLE', '1423868020', 'Shivam Tripathi', 0, '2025-09-09 08:53:50.827');
INSERT INTO public."Page" VALUES (146, '1423999050', 'Datasheet - RAK7248', 'datasheet---rak7248', 'Description The RAK7248 WisGate Developer D4H is a LoRaWAN Gateway that consists of Raspberry Pi4, RAK2287 Concentrator, and RAK2287 Pi HAT. The RAK7248C D4H has a cellular and a PoE variant. The RAK7248C WisGate Developer D4H is the cellular variant...', 'ARTICLE', '1423868020', 'Shivam Tripathi', 0, '2025-09-09 08:55:07.936');
INSERT INTO public."Page" VALUES (147, '1423409164', 'WisDuo Docs', 'wisduo-docs', 'WisDuo is a product category by RAK for the IoT industry. These modules combine an MCU and a LoRa transceiver (with BLE 5 on some variants) in a stamp-sized module, simplifying new IoT solution design.', 'SUBSECTION', '1425866753', 'India Team', 0, '2025-09-09 08:56:42.793');
INSERT INTO public."Page" VALUES (148, '1424392216', 'RAK3172', 'rak3172', 'The RAK3172 Troubleshooting Guide supports identifying and resolving issues related to LoRaWAN® communication, configuration, and power optimization. It ensures stable operation and dependable long-range performance in IoT applications.', 'SUBSECTION', '1423409164', 'India Team', 0, '2025-09-09 08:05:35.642');
INSERT INTO public."Page" VALUES (149, '1424359459', 'Product Overview - RAK3172', 'product-overview---rak3172', 'Product Description The RAK3172 is a low-power, long-range transceiver module based on the STM32WLE5CC chip. It provides an easy-to-use, small-sized, low-power solution for long-range wireless data applications. This module complies with Classes A, B...', 'ARTICLE', '1424392216', 'India Team', 0, '2025-09-09 08:07:51.884');
INSERT INTO public."Page" VALUES (150, '1424523313', 'Quick Start Guide - RAK3172', 'quick-start-guide---rak3172', 'Prerequisites Hardware Before going through the installation guide for the RAK3172 WisDuo LoRaWAN Module, ensure you have prepared the necessary items listed below. RAK3172 WisDuo LoRaWAN Module Computer USB to UART TTL adapter Software Download and ...', 'ARTICLE', '1424392216', 'India Team', 0, '2025-09-09 08:11:25.27');
INSERT INTO public."Page" VALUES (151, '1424457754', 'Datasheet - RAK3172', 'datasheet---rak3172', 'Overview Description The RAK3172 is a low-power, long-range transceiver module based on the STM32WLE5CC chip. It offers an easy-to-use, compact, and low-power solution for long-range wireless data applications. This module complies with Class A, B, a...', 'ARTICLE', '1424392216', 'India Team', 0, '2025-09-09 08:12:38.901');
INSERT INTO public."Page" VALUES (152, '1424818227', 'RAK4630', 'rak4630', 'The RAK4630 Troubleshooting Guide addresses challenges with firmware, connectivity, and hardware integration. It helps maintain reliable LoRaWAN® communication and seamless system compatibility.', 'SUBSECTION', '1423409164', 'India Team', 0, '2025-09-09 08:13:16.397');
INSERT INTO public."Page" VALUES (153, '1425932313', 'Product Overview - RAK4630', 'product-overview---rak4630', 'Product Description The RAK4630 is a low-power, long-range transceiver module featuring the Nordic nRF52840 MCU, which supports Bluetooth 5.0 (Bluetooth Low Energy) and the latest SX1262 LoRa transceiver from Semtech. This module adheres to Classes A...', 'ARTICLE', '1424818227', 'India Team', 0, '2025-09-09 08:15:30.914');
INSERT INTO public."Page" VALUES (154, '1424621650', 'Quick Start Guide - RAK4630', 'quick-start-guide---rak4630', 'Prerequisites Package Inclusion Before going through the steps in the installation guide of the RAK4630 WisDuo LoRaWAN Module, make sure to prepare the necessary items listed below: Hardware RAK4630 WisDuo LoRaWAN+BLE Module Computer USB to UART TTL ...', 'ARTICLE', '1424818227', 'India Team', 0, '2025-09-09 08:18:23.677');
INSERT INTO public."Page" VALUES (155, '1423573062', 'Datasheet - RAK4630', 'datasheet---rak4630', 'Overview Description The RAK4630 is a low-power, long-range transceiver module featuring the Nordic nRF52840 MCU, which supports Bluetooth 5.0 (Bluetooth Low Energy) and the latest SX1262 LoRa transceiver from Semtech. This module adheres to Classes ...', 'ARTICLE', '1424818227', 'India Team', 0, '2025-09-09 08:24:08.873');
INSERT INTO public."Page" VALUES (156, '1424654391', 'RAK3112', 'rak3112', 'The RAK3112 is a low-power, long-range LoRaWAN module based on the Espressif ESP32-S3 MCU with an integrated Semtech SX1262 LoRa transceiver.', 'SUBSECTION', '1423409164', 'India Team', 0, '2025-09-09 08:34:48.456');
INSERT INTO public."Page" VALUES (157, '1423802457', 'Product Overview- RAK3112', 'product-overview--rak3112', 'Product Description The RAK3112 is a low-power, long-range LoRaWAN module based on the Espressif ESP32-S3 MCU with an integrated Semtech SX1262 LoRa transceiver. Supporting LoRa, BLE, and Wi-Fi, this module is ideal for various IoT applications such ...', 'ARTICLE', '1424654391', 'India Team', 0, '2025-09-09 08:35:52.706');
INSERT INTO public."Page" VALUES (158, '1424457801', 'Quick Start Guide - RAK3112', 'quick-start-guide---rak3112', 'Prerequisites Before going through the steps of installing the RAK3112 WisDuo LPWAN Module, make sure to prepare the necessary items listed below. Hardware RAK3112 WisDuo LPWAN+BLE+Wi-Fi Module Computer USB adapter Software Download and install the A...', 'ARTICLE', '1424654391', 'India Team', 0, '2025-09-09 08:37:38.709');
INSERT INTO public."Page" VALUES (159, '1424392230', 'Datasheet - RAK3112', 'datasheet---rak3112', 'Overview Description The RAK3112 is a low-power, long-range LoRaWAN module based on the Espressif ESP32-S3 MCU with an integrated Semtech SX1262 LoRa transceiver. Supporting LoRa, BLE, and Wi-Fi, this module is ideal for various IoT applications such...', 'ARTICLE', '1424654391', 'India Team', 0, '2025-09-09 08:38:48.325');
INSERT INTO public."Page" VALUES (161, '1425145909', 'Product Overview - RAK11300', 'product-overview---rak11300', 'Product Description The RAK11300 WisDuo LPWAN Module is based on the Raspberry Pi RP2040 chip and SX1262 RF transceiver. It provides an easy-to-use, small, low-power solution for long-range wireless data applications. This module complies with LoRaWA...', 'ARTICLE', '1423802434', 'India Team', 0, '2025-09-09 08:31:19.429');
INSERT INTO public."Page" VALUES (162, '1423376449', 'Quick Start Guide- RAK11300', 'quick-start-guide--rak11300', 'RAK11300 WisDuo LPWAN Module Quick Start Guide This guide covers the following topics: The Things Network Guide - How to login, register new accounts and create new applications on TTN. RAK11300 TTN OTAA Guide - How to add OTAA device on TTN and what...', 'ARTICLE', '1423802434', 'India Team', 0, '2025-09-09 08:32:35.299');
INSERT INTO public."Page" VALUES (163, '1423507513', 'Datasheet - RAK11300', 'datasheet---rak11300', 'Overview Description The RAK11300 WisDuo LPWAN Module is based on the Raspberry Pi RP2040 chip and SX1262 RF transceiver. It provides an easy-to-use, small, low-power solution for long-range wireless data applications. This module complies with LoRaW...', 'ARTICLE', '1423802434', 'India Team', 0, '2025-09-09 08:33:48.392');
INSERT INTO public."Page" VALUES (164, '1423736863', 'Troubleshooting Handbook', 'troubleshooting-handbook', 'The RAKwireless Troubleshooting Handbook serves as a reference guide for identifying, analyzing, and resolving common technical issues across RAKwireless products.', 'SUBSECTION', '1399914501', 'India Team', 0, '2025-09-09 07:47:13.376');
INSERT INTO public."Page" VALUES (165, '1425178638', 'Gateways', 'gateways', 'The Gateways Troubleshooting Guide provides detailed procedures for diagnosing and resolving issues related to RAKwireless gateway devices.', 'SUBSECTION', '1423736863', 'India Team', 0, '2025-09-09 09:01:09.039');
INSERT INTO public."Page" VALUES (166, '1423245326', 'Indoor Gateways', 'indoor-gateways', 'The Indoor Gateways Troubleshooting Guide focuses on diagnosing and resolving issues specific to indoor gateway deployments. It covers setup, connectivity, and configuration challenges, ensuring stable operation in office, lab, or small-scale environ...', 'ARTICLE', '1425178638', 'India Team', 0, '2025-09-09 07:20:58.425');
INSERT INTO public."Page" VALUES (167, '1424424996', 'Outdoor Gateways', 'outdoor-gateways', 'The Outdoor Gateways Troubleshooting Guide provides procedures for addressing installation, environmental, and performance issues in outdoor gateway deployments.', 'ARTICLE', '1425178638', 'India Team', 0, '2025-09-09 07:48:11.996');
INSERT INTO public."Page" VALUES (168, '1424162861', 'Developer Gateways', 'developer-gateways', 'The Developer Gateways Troubleshooting Guide supports troubleshooting for gateways designed for testing and prototyping.', 'ARTICLE', '1425178638', 'India Team', 0, '2025-09-09 07:48:29.501');
INSERT INTO public."Page" VALUES (169, '1423441955', 'Modules', 'modules', 'The Modules Troubleshooting Guide outlines systematic methods for identifying and resolving issues in RAKwireless module products.', 'SUBSECTION', '1423736863', 'India Team', 0, '2025-09-09 07:49:45.851');
INSERT INTO public."Page" VALUES (170, '1425997826', 'LoRa® Modules', 'lora-modules', 'The LoRa® Modules Troubleshooting Guide assists in diagnosing hardware, firmware, and connectivity issues.', 'ARTICLE', '1423441955', 'India Team', 0, '2025-09-09 07:48:56.386');
INSERT INTO public."Page" VALUES (171, '1425178656', 'Cellular Modules', 'cellular-modules', 'The Cellular Modules Troubleshooting Guide covers troubleshooting methods for signal quality, registration, and configuration challenges.', 'ARTICLE', '1423441955', 'India Team', 0, '2025-09-09 07:49:11.421');
INSERT INTO public."Page" VALUES (172, '1423573014', 'Wi-Fi / BLE Modules', 'wi-fi--ble-modules', 'The Wi-Fi / BLE Modules Troubleshooting Guide provides solutions for pairing, communication, and setup issues. It helps maintain smooth integration with wireless networks and IoT systems.', 'ARTICLE', '1423441955', 'India Team', 0, '2025-09-09 07:34:47.649');
INSERT INTO public."Page" VALUES (173, '1425866762', 'WisBlock (Modular IoT System)', 'wisblock-modular-iot-system', 'The WisBlock Troubleshooting Guide provides methods for diagnosing and resolving issues within the WisBlock modular IoT system.', 'SUBSECTION', '1423736863', 'India Team', 0, '2025-09-09 08:52:33.279');
INSERT INTO public."Page" VALUES (174, '1424261147', 'Base Boards', 'base-boards', 'The Base Boards Troubleshooting Guide supports identifying and resolving issues in system assembly and module compatibility. It ensures reliable foundations for modular IoT development.', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:35:44.557');
INSERT INTO public."Page" VALUES (175, '1423474736', 'Sensor Modules', 'sensor-modules', 'The Sensor Modules Troubleshooting Guide focuses on calibration, accuracy, and connectivity issues. It ensures dependable sensing and data collection across IoT deployments.', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:37:12.338');
INSERT INTO public."Page" VALUES (176, '1424031798', 'Core Modules', 'core-modules', 'The Core Modules Troubleshooting Guide addresses performance, firmware, and connectivity challenges. It helps maintain stable operation and consistent processing for diverse applications.', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:36:47.44');
INSERT INTO public."Page" VALUES (177, '1425178665', 'Interface Modules', 'interface-modules', 'The Interface Modules Troubleshooting Guide provides solutions for communication and control interface issues. It ensures smooth integration with external systems and stable operation.', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:38:03.148');
INSERT INTO public."Page" VALUES (178, '1423638541', 'Power Modules', 'power-modules', 'The Power Modules Troubleshooting Guide covers troubleshooting for charging, supply, and energy management challenges. It ensures consistent and reliable power delivery in IoT solutions.Po', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:38:31.256');
INSERT INTO public."Page" VALUES (179, '1425047605', 'Connectivity Modules', 'connectivity-modules', 'The Connectivity Modules Troubleshooting Guide supports identifying and resolving positioning and communication issues. It helps maintain accurate, dependable connectivity across various applications.', 'ARTICLE', '1425866762', 'India Team', 0, '2025-09-09 07:39:04.4');
INSERT INTO public."Page" VALUES (180, '1400209427', 'Case Studies', 'case-studies', 'The Case Studies section highlights real-world deployments of RakWireless technology across different industries. These examples showcase how our products enable IoT solutions at scale, delivering value through innovation, reliability, and performanc...', 'SUBSECTION', '1397489708', 'India Team', 0, '2025-09-03 11:14:03.406');
INSERT INTO public."Page" VALUES (181, '1395818535', 'A-to-B Visibility and Temperature Control for Product Tracking', 'a-to-b-visibility-and-temperature-control-for-product-tracking', 'A-to-B Visibility and Temperature Control for Product Tracking . Overview Company A is committed to sustainable practices by minimizing its carbon footprint and reducing packaging waste through the implementation of a reusable packaging approach. To ...', 'ARTICLE', '1400209427', 'India Team', 0, '2025-09-02 09:55:11.705');
INSERT INTO public."Page" VALUES (182, '1395523605', 'Indoor CO₂ Air Monitoring Solution for LoRaWAN®', 'indoor-co₂-air-monitoring-solution-for-lorawan', 'Indoor CO₂ Air Monitoring Solution for LoRaWAN® Overview School A, located in a busy city center, is grappling with elevated indoor carbon dioxide (CO₂) levels - a silent issue adversely impacting students'' health and concentration. Although CO₂ is g...', 'ARTICLE', '1400209427', 'India Team', 0, '2025-09-02 10:01:45.285');
INSERT INTO public."Page" VALUES (183, '1396375565', 'Wireless Temperature and Humidity Sensor: Monitoring and Preventing Condensation', 'wireless-temperature-and-humidity-sensor-monitoring-and-preventing-condensation', 'Wireless Temperature and Humidity Sensor: Monitoring and Preventing Condensation Overview Company A is a leading food manufacturer and distributor with warehouses spread across the country. They specialize in perishable goods, making the climate with...', 'ARTICLE', '1400209427', 'India Team', 0, '2025-09-02 10:06:36.49');
INSERT INTO public."Page" VALUES (184, '1400340498', 'Department', 'department', 'Departments RakWireless operates through several specialized departments that collaborate to deliver cutting-edge IoT solutions. This section provides an overview of the key teams, their roles, and the tools they rely on. 📈 Sales & Marketing Purpose:...', 'SUBSECTION', NULL, 'India Team', 0, '2025-09-03 09:57:07.163');
INSERT INTO public."Page" VALUES (186, '1394671670', 'RAKwireless Influencer Agreement', 'rakwireless-influencer-agreement', '13 Feb 2025 Complete Name of Influencer Complete Address of Influencer Subject: RAKwireless Influencer Agreement Dear {{First Name}} , Thank you for agreeing to collaborate with RAKwireless and create content about your experience with using our prod...', 'ARTICLE', '1399390229', 'Shivam Tripathi', 0, '2025-09-02 11:21:03.207');
INSERT INTO public."Page" VALUES (187, '1397456944', 'Content and SEO Roadmap Planning', 'content-and-seo-roadmap-planning', 'Team mission List all content and SEO projects and align on priorities. Send for review 🔗 Project information This document serves as a roadmap for planning all content strategy and SEO projects. It outlines the priorities, effort required, and dates...', 'ARTICLE', '1399390229', 'Shivam Tripathi', 0, '2025-09-02 11:21:56.328');
INSERT INTO public."Page" VALUES (188, '1401257991', 'Campaigns', 'campaigns', 'Sales and Marketing Campaigns The Sales and Marketing Campaigns section showcases RakWireless initiatives to engage customers, promote products, and drive growth across global markets. Campaigns are designed to highlight product value, strengthen bra...', 'SUBSECTION', '1399390229', 'India Team', 0, '2025-09-03 09:58:40.895');
INSERT INTO public."Page" VALUES (189, '1396441246', 'Regular Campaigns', 'regular-campaigns', '🗓 WorkBack Schedule Before starting the execution of any regular campaign, a two week span is needed. The actions, assignees and time needed is described in the chart below Day 1 Day 2 Day 3 Day 4 Day 5 Week 1 ➡ Content idea generation Approval of id...', 'ARTICLE', '1401257991', 'Shivam Tripathi', 0, '2025-09-02 11:18:33.449');
INSERT INTO public."Page" VALUES (190, '1393033286', 'Campaign plan template', 'campaign-plan-template', 'SM 1 Assets SM 2 Assets Campaign report Types of goals and metrics to use Notes for campaign manager Campaign Week June 5 - 9 Campaign Manager Xose Perez Approver/s Ken, Anson and Deni Objective and SM goals This month’s objective: Product awareness ...', 'ARTICLE', '1401257991', 'Shivam Tripathi', 0, '2025-09-02 11:19:47.27');
INSERT INTO public."Page" VALUES (191, '1412268081', 'India Sales', 'india-sales', 'Sales info of indian market', 'ARTICLE', '1399390229', 'Shivam Tripathi', 0, '2025-09-05 07:43:19.58');
INSERT INTO public."Page" VALUES (192, '1399259155', 'IT & DevOps', 'it-devops', 'IT & DevOps manages RakWireless’s infrastructure, ensuring it is secure, reliable, and scalable. The team handles systems, deployments, monitoring, and automation for business continuity.', 'SUBSECTION', '1400340498', 'India Team', 0, '2025-09-03 11:16:01.299');
INSERT INTO public."Page" VALUES (193, '1399980064', 'Incident Management', 'incident-management', 'IT & DevOps – Incident Management The Incident Management process ensures RakWireless can quickly identify, respond to, and resolve IT and infrastructure issues while minimizing downtime and impact on business operations. 🎯 Objectives Detect incident...', 'SUBSECTION', '1399259155', 'India Team', 0, '2025-09-03 10:00:29.084');
INSERT INTO public."Page" VALUES (194, '1398669317', '2021', '2021', 'Incident Report 2021 The year 2021 marked a period of rapid growth for RakWireless, with several critical infrastructure and system updates. Below is a summary of major IT & DevOps incidents during the year. 📊 Overview Total Incidents: 42 Critical (S...', 'SUBSECTION', '1399980064', 'India Team', 0, '2025-09-03 10:01:59.762');
INSERT INTO public."Page" VALUES (195, '1392083037', 'SI-4112021', 'si-4112021', 'ID SI-4112021 Date and time of Incident 04.11.2021 Reported date and time of Incident 04.11.2021 Contact information Roy de Geest Method of Detection Reported by Chris Liang Affected Finance Team Workstations Security Incident Urgency High Security I...', 'ARTICLE', '1398669317', 'Shivam Tripathi', 0, '2025-09-02 11:13:04.805');
INSERT INTO public."Page" VALUES (196, '1392869461', 'SI-6092021', 'si-6092021', 'ID SI-6092021 Date and time of Incident 06.09.2021 Reported date and time of Incident 06.09.2021 Contact information Zendesk Security Team Method of Detection Reported by supplier - Zendesk Security Team Affected RAK WSDM Security Incident Urgency Hi...', 'ARTICLE', '1398669317', 'Shivam Tripathi', 0, '2025-09-02 11:13:45.655');
INSERT INTO public."Page" VALUES (197, '1399291934', '2022', '2022', 'Incident Report 2022 The year 2022 saw improved resilience, but a few significant incidents highlighted areas for further strengthening. 📊 Overview Total Incidents: 35 Critical (Sev 1): 4 High (Sev 2): 8 Medium (Sev 3): 12 Low (Sev 4): 11 Average MTT...', 'SUBSECTION', '1399980064', 'India Team', 0, '2025-09-03 10:02:20.845');
INSERT INTO public."Page" VALUES (198, '1393033277', 'SI-5222022', 'si-5222022', 'ID SI-5222022 Date and time of Incident 10.05.2022 Reported date and time of Incident 10.05.2022 Contact information Roy de Geest Method of Detection Reported by customer - Syscom Prorep Affected End-user mailbox Security Incident Urgency High Securi...', 'ARTICLE', '1399291934', 'Shivam Tripathi', 0, '2025-09-02 11:14:54.851');
INSERT INTO public."Page" VALUES (199, '1397194760', 'GDPR Compliance edited', 'gdpr-compliance-edited', 'What is GDPR The General Data Protection Regulation (next “the GDPR”) is a legal framework that establishes the guidelines for processing the personal information of individuals living within the EU territory. The GDPR applies regardless of where the...', 'ARTICLE', '1399259155', 'Shivam Tripathi', 0, '2025-11-11 12:29:37.364');
INSERT INTO public."Page" VALUES (200, '1396899861', 'Cybersecurity Compliance - Product post edit', 'cybersecurity-compliance---product-post-edit', 'Every country now has cybersecurity requirements for electronic products. Some of these plans have already become active, such as in the UK, while others, like those in the EU, will take effect in the next few years. These regulations vary, with some...', 'ARTICLE', '1399259155', 'Shivam Tripathi', 0, '2025-11-11 11:27:12.793');
INSERT INTO public."Page" VALUES (201, '1479016483', 'Demo page for meeting edited by shivam', 'demo-page-for-meeting-edited-by-shivam', 'Submitted by: member1 This is the content of the DEMO. Below is a PDF: Below is a image: Edited by shivam', 'ARTICLE', '1399259155', 'Shivam Tripathi', 0, '2025-11-11 12:23:04.452');
INSERT INTO public."Page" VALUES (202, '1398964250', 'Customer Support Team', 'customer-support-team', 'The Customer Support Team assists customers with product setup, troubleshooting, and issue resolution. They ensure customer satisfaction while providing valuable feedback for continuous improvement.', 'SUBSECTION', '1400340498', 'India Team', 0, '2025-09-03 11:16:22.735');
INSERT INTO public."Page" VALUES (203, '1397424133', 'Offline Order Process Flow and Guidelines', 'offline-order-process-flow-and-guidelines', 'Standard Process Flow Check customer and order history Prepare quotations and sales orders promptly based on customers requirements. Confirm  complete customer data Set customer expectations regarding lead times and payment confirmations. Confirm ord...', 'ARTICLE', '1398964250', 'India Team', 0, '2025-09-03 11:47:27.988');
INSERT INTO public."Page" VALUES (204, '1395163149', 'Online Order Process Flow and Guidelines', 'online-order-process-flow-and-guidelines', 'Standard Process flow for Online Orders Customer places an online order from the webstore Unfulfilled Order generation in Shopify Shopify Order synced in Odoo as quotation Verification of customer and order details CST manually checks all order and c...', 'ARTICLE', '1398964250', 'India Team', 0, '2025-09-09 10:11:56.035');
INSERT INTO public."Page" VALUES (205, '1397358612', 'GUIDELINES EDITED', 'guidelines-edited', 'When Should CST confirm orders in Odoo? When customers issues Purchase Orders When customers sends payment receipts When finance team confirms the receipt of the payment When customers provided an intent or promise to pay When Should CST generate ord...', 'ARTICLE', '1398964250', 'Shivam Tripathi', 0, '2025-11-11 12:55:01.906');
INSERT INTO public."Page" VALUES (206, '1398767651', 'Frequently Asked Questions', 'frequently-asked-questions', 'Customer Support Team – FAQs This section compiles answers to the most frequently asked questions (FAQs) received by the Customer Support Team.', 'SUBSECTION', '1398964250', 'India Team', 0, '2025-09-03 10:04:05.877');
INSERT INTO public."Page" VALUES (207, '1397424149', 'Sensorhub FAQs', 'sensorhub-faqs', 'Q: When can I buy the SensorHub to test it? A: You can buy the sensor hub from our webstore for testing purposes now. Q: What type of batteries use the SensorHUB? A: SensorHub needs 4pcs Lithium Battery ER18505 3.6V 3600mAh (Non-Rechargeable). Q: In ...', 'ARTICLE', '1398767651', 'Shivam Tripathi', 0, '2025-09-02 10:40:19.302');
INSERT INTO public."Page" VALUES (208, '1397456905', 'RAK3172 FAQs', 'rak3172-faqs', 'Q: Is it possible to buy same module but program different firmware? For example, buy RAK3172 US915 and use it for EU868. / What is the difference between US915 Hardware and EU868 Hardware? A: Different frequencies have the same hardware. The only di...', 'ARTICLE', '1398767651', 'Shivam Tripathi', 0, '2025-09-02 10:41:10.794');
INSERT INTO public."Page" VALUES (209, '1400504330', 'Research & Development', 'research-development', 'R&D drives innovation at RakWireless through product design, prototyping, and testing. The team explores new technologies and ensures products meet industry standards.', 'SUBSECTION', '1400340498', 'India Team', 0, '2025-09-03 11:16:48.338');
INSERT INTO public."Page" VALUES (210, '1399029778', 'WisGate', 'wisgate', 'Gateways for LoRaWAN WisGate is a category of products built by the RAK company for the IoT Industry. It is the backbone of the network where it offers a cost-efficient and wide range of gateway solutions for building LPWAN. These gateways act as an ...', 'SUBSECTION', '1400504330', 'Shivam Tripathi', 0, '2025-09-03 12:53:04.151');
INSERT INTO public."Page" VALUES (211, '1392869444', 'WisGate Onboarding v0.4.1', 'wisgate-onboarding-v041', 'Welcome to the team! We are happy to see you in the family of Wis projects, namely WisGate ! This page will help you get familiar with the project and the basic rules and artefacts used on the project. In case of questions, you can always contact the...', 'ARTICLE', '1399029778', 'Shivam Tripathi', 0, '2025-09-02 10:47:44.332');
INSERT INTO public."Page" VALUES (212, '1396867094', 'Product Overview', 'product-overview', 'Client Overview Client Problems and Objectives Product Idea Product High-Level Representation Client Overview RAKwireless ( https://www.rakwireless.com/en-us ) is a manufacturer of IoT devices and accessories. While focusing on hardware production, t...', 'ARTICLE', '1399029778', 'Shivam Tripathi', 0, '2025-09-02 10:49:54.023');
INSERT INTO public."Page" VALUES (213, '1399488535', 'WisBlock', 'wisblock', 'WisBlock WisBlock is a modular IoT system that enables rapid prototyping and scalable production of IoT solutions. 📋 Key Features Core Modules – Processing and connectivity (LoRaWAN, LTE, BLE, Wi-Fi) Sensor & IO Modules – Environmental, motion, GPS, ...', 'SUBSECTION', '1400504330', 'India Team', 0, '2025-09-03 10:06:01.081');
INSERT INTO public."Page" VALUES (214, '1397587990', 'WisBlock Project Management Plan', 'wisblock-project-management-plan', 'Not Miss but Simplify Things!!! Updated by 10 Nov 2022 Regular Launch Things we would achieve (WHY) Things we could do (WHAT) Tools / Approach (HOW) Example Launch Plan Definition (more feasible launch plan by month/quarter, with more flexibility in ...', 'ARTICLE', '1399488535', 'Shivam Tripathi', 0, '2025-09-02 11:02:46.861');
INSERT INTO public."Page" VALUES (215, '1395851290', 'WisBlock - eCommerce Brainstorm ideas', 'wisblock---ecommerce-brainstorm-ideas', 'We will consider 2 customer journeys for WisBlock: Product Buying journey and Product Using journey (they are more or less different but cannot be seperated). As all achieved ideas below, we will focus on Product Buying journey more. For Product Usin...', 'ARTICLE', '1399488535', 'Shivam Tripathi', 0, '2025-09-02 11:03:54.118');
INSERT INTO public."Page" VALUES (216, '1396015178', 'WisGateOS', 'wisgateos', 'WisGateOS WisGateOS is the operating system powering RakWireless WisGate LoRaWAN® Gateways . It provides a user-friendly interface and advanced configuration tools. 📋 Key Features Web-based management dashboard Easy LoRaWAN network server integration...', 'SUBSECTION', '1400504330', 'India Team', 0, '2025-09-03 10:06:24.075');
INSERT INTO public."Page" VALUES (217, '1394475074', 'WisGateOS2 Breathing Light design', 'wisgateos2-breathing-light-design', 'LED Utilities /usr/bin/breathing_led : Breathing LED control functions  (breathing_led --setc (color), --sett (time), --setm (mode), --debug, --help…) /sbin/breathing_light : Breathing Light main service /etc/hotplug.d/iface/99-breathing_led /lib/fun...', 'ARTICLE', '1396015178', 'Shivam Tripathi', 0, '2025-09-02 10:57:25.642');
INSERT INTO public."Page" VALUES (218, '1395228712', 'GPS UBOX Message Generator', 'gps-ubox-message-generator', 'Usage Example For these ubox message, u just need to focues on contents in green box. Focues on Class , ID Length(2 bytes) and payload . In this example, there is no payload. run python script like below: python ubxgen.py 06 31 00 00 > CFG_TP5_comman...', 'ARTICLE', '1396015178', 'Shivam Tripathi', 0, '2025-09-02 11:00:50.218');
INSERT INTO public."Page" VALUES (219, '1399783443', 'Tools', 'tools', 'The Tools section lists the software and platforms used across RakWireless teams. It ensures employees know which solutions are available to support productivity, collaboration, and project execution.', 'SUBSECTION', NULL, 'India Team', 0, '2025-09-03 11:15:02.208');
INSERT INTO public."Page" VALUES (220, '1400176654', 'Web Development', 'web-development', 'RakWireless uses web development tools for coding, testing, deployment, and version control. They ensure applications and portals are reliable, scalable, and easy to maintain.', 'ARTICLE', '1399783443', 'India Team', 0, '2025-09-03 11:20:54.029');
INSERT INTO public."Page" VALUES (221, '1398833172', 'Management & Operations', 'management-operations', 'Management tools support collaboration, planning, and project tracking. They keep workflows organized and ensure timely delivery.', 'ARTICLE', '1399783443', 'India Team', 0, '2025-09-03 11:22:38.138');
INSERT INTO public."Page" VALUES (222, '1481277456', 'Analytics', 'analytics', 'No description available.', 'SUBSECTION', '1399783443', 'Shivam Tripathi', 0, '2025-09-25 10:54:42.188');
INSERT INTO public."Page" VALUES (223, '1676214311', 'Analytics Tools', 'analytics-tools', 'Submitted by: Arjun Dangle Organizations use a wide range of analytics tools for business intelligence, data visualization, and advanced analysis, including popular platforms like Tableau and Microsoft Power BI . Other common tools include Google Ana...', 'ARTICLE', '1481277456', 'Shivam Tripathi', 0, '2025-11-11 11:01:29.381');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--



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
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Tag" VALUES (1, 'vue', 'vue');
INSERT INTO public."Tag" VALUES (2, 'react', 'react');
INSERT INTO public."Tag" VALUES (7, 'campaign', 'campaign');
INSERT INTO public."Tag" VALUES (132, 'sensor', 'sensor');
INSERT INTO public."Tag" VALUES (239, 'india', 'india');
INSERT INTO public."Tag" VALUES (227, 'marketing', 'marketing');
INSERT INTO public."Tag" VALUES (229, 'sales', 'sales');
INSERT INTO public."Tag" VALUES (24, 'tech-support', 'tech-support');
INSERT INTO public."Tag" VALUES (25, 'multicast', 'multicast');
INSERT INTO public."Tag" VALUES (26, 'power', 'power');
INSERT INTO public."Tag" VALUES (27, 'review-test', 'review-test');
INSERT INTO public."Tag" VALUES (243, 'incident', 'incident');
INSERT INTO public."Tag" VALUES (69, 'compliance', 'compliance');
INSERT INTO public."Tag" VALUES (247, 'gdpr', 'gdpr');
INSERT INTO public."Tag" VALUES (242, 'devops', 'devops');
INSERT INTO public."Tag" VALUES (151, 'indoor-gateway', 'indoor-gateway');
INSERT INTO public."Tag" VALUES (30, 'handbook', 'handbook');
INSERT INTO public."Tag" VALUES (251, 'demo', 'demo');
INSERT INTO public."Tag" VALUES (74, 'vpn', 'vpn');
INSERT INTO public."Tag" VALUES (46, 'meow', 'meow');
INSERT INTO public."Tag" VALUES (249, 'guidelines', 'guidelines');
INSERT INTO public."Tag" VALUES (257, 'sensorshub', 'sensorshub');
INSERT INTO public."Tag" VALUES (3, 'module', 'module');
INSERT INTO public."Tag" VALUES (162, 'outdoor-gateway', 'outdoor-gateway');
INSERT INTO public."Tag" VALUES (258, 'faq', 'faq');
INSERT INTO public."Tag" VALUES (59, 'getting', 'getting');
INSERT INTO public."Tag" VALUES (60, 'started', 'started');
INSERT INTO public."Tag" VALUES (4, 'test', 'test');
INSERT INTO public."Tag" VALUES (62, 'tag', 'tag');
INSERT INTO public."Tag" VALUES (22, 'gateway', 'gateway');
INSERT INTO public."Tag" VALUES (29, 'wisgate', 'wisgate');
INSERT INTO public."Tag" VALUES (39, 'testing', 'testing');
INSERT INTO public."Tag" VALUES (53, 'testing-shivam', 'testing-shivam');
INSERT INTO public."Tag" VALUES (38, 'ttn', 'ttn');
INSERT INTO public."Tag" VALUES (5, 'developer-gateway', 'developer-gateway');
INSERT INTO public."Tag" VALUES (28, 'wisblock', 'wisblock');
INSERT INTO public."Tag" VALUES (272, 'wisgateos', 'wisgateos');
INSERT INTO public."Tag" VALUES (8, 'chirpstack', 'chirpstack');
INSERT INTO public."Tag" VALUES (263, 'research', 'research');
INSERT INTO public."Tag" VALUES (16, 'cybersec', 'cybersec');
INSERT INTO public."Tag" VALUES (10, 'core', 'core');
INSERT INTO public."Tag" VALUES (19, 'cst', 'cst');
INSERT INTO public."Tag" VALUES (11, 'base-board', 'base-board');
INSERT INTO public."Tag" VALUES (95, 'overview', 'overview');
INSERT INTO public."Tag" VALUES (99, 'guide', 'guide');
INSERT INTO public."Tag" VALUES (71, 'wisduo', 'wisduo');
INSERT INTO public."Tag" VALUES (103, 'datasheet', 'datasheet');
INSERT INTO public."Tag" VALUES (13, 'case-study', 'case-study');
INSERT INTO public."Tag" VALUES (222, 'monitoring', 'monitoring');
INSERT INTO public."Tag" VALUES (228, 'influencers', 'influencers');
INSERT INTO public."Tag" VALUES (9, 'content', 'content');


--
-- Data for Name: _GroupToUser; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _PageToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."_PageToTag" VALUES (4, 1);
INSERT INTO public."_PageToTag" VALUES (4, 2);
INSERT INTO public."_PageToTag" VALUES (9, 3);
INSERT INTO public."_PageToTag" VALUES (9, 4);
INSERT INTO public."_PageToTag" VALUES (9, 5);
INSERT INTO public."_PageToTag" VALUES (17, 4);
INSERT INTO public."_PageToTag" VALUES (22, 7);
INSERT INTO public."_PageToTag" VALUES (22, 8);
INSERT INTO public."_PageToTag" VALUES (22, 9);
INSERT INTO public."_PageToTag" VALUES (22, 10);
INSERT INTO public."_PageToTag" VALUES (28, 7);
INSERT INTO public."_PageToTag" VALUES (28, 11);
INSERT INTO public."_PageToTag" VALUES (28, 13);
INSERT INTO public."_PageToTag" VALUES (30, 7);
INSERT INTO public."_PageToTag" VALUES (30, 9);
INSERT INTO public."_PageToTag" VALUES (30, 10);
INSERT INTO public."_PageToTag" VALUES (30, 16);
INSERT INTO public."_PageToTag" VALUES (32, 9);
INSERT INTO public."_PageToTag" VALUES (32, 10);
INSERT INTO public."_PageToTag" VALUES (32, 16);
INSERT INTO public."_PageToTag" VALUES (32, 19);
INSERT INTO public."_PageToTag" VALUES (70, 22);
INSERT INTO public."_PageToTag" VALUES (70, 11);
INSERT INTO public."_PageToTag" VALUES (70, 24);
INSERT INTO public."_PageToTag" VALUES (70, 25);
INSERT INTO public."_PageToTag" VALUES (70, 26);
INSERT INTO public."_PageToTag" VALUES (71, 27);
INSERT INTO public."_PageToTag" VALUES (73, 28);
INSERT INTO public."_PageToTag" VALUES (73, 29);
INSERT INTO public."_PageToTag" VALUES (73, 30);
INSERT INTO public."_PageToTag" VALUES (74, 8);
INSERT INTO public."_PageToTag" VALUES (74, 22);
INSERT INTO public."_PageToTag" VALUES (74, 29);
INSERT INTO public."_PageToTag" VALUES (74, 30);
INSERT INTO public."_PageToTag" VALUES (75, 22);
INSERT INTO public."_PageToTag" VALUES (75, 29);
INSERT INTO public."_PageToTag" VALUES (75, 30);
INSERT INTO public."_PageToTag" VALUES (75, 38);
INSERT INTO public."_PageToTag" VALUES (77, 39);
INSERT INTO public."_PageToTag" VALUES (78, 4);
INSERT INTO public."_PageToTag" VALUES (79, 4);
INSERT INTO public."_PageToTag" VALUES (80, 4);
INSERT INTO public."_PageToTag" VALUES (82, 39);
INSERT INTO public."_PageToTag" VALUES (83, 4);
INSERT INTO public."_PageToTag" VALUES (84, 4);
INSERT INTO public."_PageToTag" VALUES (85, 46);
INSERT INTO public."_PageToTag" VALUES (86, 46);
INSERT INTO public."_PageToTag" VALUES (87, 46);
INSERT INTO public."_PageToTag" VALUES (88, 4);
INSERT INTO public."_PageToTag" VALUES (91, 4);
INSERT INTO public."_PageToTag" VALUES (92, 4);
INSERT INTO public."_PageToTag" VALUES (93, 4);
INSERT INTO public."_PageToTag" VALUES (93, 39);
INSERT INTO public."_PageToTag" VALUES (93, 53);
INSERT INTO public."_PageToTag" VALUES (94, 4);
INSERT INTO public."_PageToTag" VALUES (94, 39);
INSERT INTO public."_PageToTag" VALUES (94, 53);
INSERT INTO public."_PageToTag" VALUES (95, 4);
INSERT INTO public."_PageToTag" VALUES (96, 4);
INSERT INTO public."_PageToTag" VALUES (96, 59);
INSERT INTO public."_PageToTag" VALUES (96, 60);
INSERT INTO public."_PageToTag" VALUES (96, 62);
INSERT INTO public."_PageToTag" VALUES (99, 13);
INSERT INTO public."_PageToTag" VALUES (99, 53);
INSERT INTO public."_PageToTag" VALUES (99, 11);
INSERT INTO public."_PageToTag" VALUES (99, 19);
INSERT INTO public."_PageToTag" VALUES (99, 16);
INSERT INTO public."_PageToTag" VALUES (99, 9);
INSERT INTO public."_PageToTag" VALUES (99, 69);
INSERT INTO public."_PageToTag" VALUES (100, 39);
INSERT INTO public."_PageToTag" VALUES (100, 71);
INSERT INTO public."_PageToTag" VALUES (100, 53);
INSERT INTO public."_PageToTag" VALUES (100, 38);
INSERT INTO public."_PageToTag" VALUES (100, 74);
INSERT INTO public."_PageToTag" VALUES (100, 28);
INSERT INTO public."_PageToTag" VALUES (101, 10);
INSERT INTO public."_PageToTag" VALUES (101, 16);
INSERT INTO public."_PageToTag" VALUES (101, 19);
INSERT INTO public."_PageToTag" VALUES (102, 7);
INSERT INTO public."_PageToTag" VALUES (102, 8);
INSERT INTO public."_PageToTag" VALUES (102, 13);
INSERT INTO public."_PageToTag" VALUES (103, 10);
INSERT INTO public."_PageToTag" VALUES (103, 16);
INSERT INTO public."_PageToTag" VALUES (103, 19);
INSERT INTO public."_PageToTag" VALUES (104, 9);
INSERT INTO public."_PageToTag" VALUES (104, 10);
INSERT INTO public."_PageToTag" VALUES (104, 19);
INSERT INTO public."_PageToTag" VALUES (105, 7);
INSERT INTO public."_PageToTag" VALUES (105, 8);
INSERT INTO public."_PageToTag" VALUES (105, 13);
INSERT INTO public."_PageToTag" VALUES (106, 7);
INSERT INTO public."_PageToTag" VALUES (106, 11);
INSERT INTO public."_PageToTag" VALUES (106, 13);
INSERT INTO public."_PageToTag" VALUES (110, 28);
INSERT INTO public."_PageToTag" VALUES (111, 11);
INSERT INTO public."_PageToTag" VALUES (111, 28);
INSERT INTO public."_PageToTag" VALUES (111, 95);
INSERT INTO public."_PageToTag" VALUES (112, 11);
INSERT INTO public."_PageToTag" VALUES (112, 28);
INSERT INTO public."_PageToTag" VALUES (112, 99);
INSERT INTO public."_PageToTag" VALUES (113, 11);
INSERT INTO public."_PageToTag" VALUES (113, 28);
INSERT INTO public."_PageToTag" VALUES (113, 103);
INSERT INTO public."_PageToTag" VALUES (115, 11);
INSERT INTO public."_PageToTag" VALUES (115, 28);
INSERT INTO public."_PageToTag" VALUES (115, 95);
INSERT INTO public."_PageToTag" VALUES (116, 11);
INSERT INTO public."_PageToTag" VALUES (116, 28);
INSERT INTO public."_PageToTag" VALUES (116, 99);
INSERT INTO public."_PageToTag" VALUES (117, 11);
INSERT INTO public."_PageToTag" VALUES (117, 28);
INSERT INTO public."_PageToTag" VALUES (117, 103);
INSERT INTO public."_PageToTag" VALUES (119, 10);
INSERT INTO public."_PageToTag" VALUES (119, 28);
INSERT INTO public."_PageToTag" VALUES (119, 95);
INSERT INTO public."_PageToTag" VALUES (120, 10);
INSERT INTO public."_PageToTag" VALUES (120, 28);
INSERT INTO public."_PageToTag" VALUES (120, 99);
INSERT INTO public."_PageToTag" VALUES (121, 10);
INSERT INTO public."_PageToTag" VALUES (121, 28);
INSERT INTO public."_PageToTag" VALUES (121, 103);
INSERT INTO public."_PageToTag" VALUES (123, 10);
INSERT INTO public."_PageToTag" VALUES (123, 28);
INSERT INTO public."_PageToTag" VALUES (123, 95);
INSERT INTO public."_PageToTag" VALUES (124, 10);
INSERT INTO public."_PageToTag" VALUES (124, 28);
INSERT INTO public."_PageToTag" VALUES (124, 99);
INSERT INTO public."_PageToTag" VALUES (125, 10);
INSERT INTO public."_PageToTag" VALUES (125, 28);
INSERT INTO public."_PageToTag" VALUES (125, 103);
INSERT INTO public."_PageToTag" VALUES (127, 28);
INSERT INTO public."_PageToTag" VALUES (127, 95);
INSERT INTO public."_PageToTag" VALUES (127, 132);
INSERT INTO public."_PageToTag" VALUES (128, 28);
INSERT INTO public."_PageToTag" VALUES (128, 99);
INSERT INTO public."_PageToTag" VALUES (128, 132);
INSERT INTO public."_PageToTag" VALUES (129, 28);
INSERT INTO public."_PageToTag" VALUES (129, 103);
INSERT INTO public."_PageToTag" VALUES (129, 132);
INSERT INTO public."_PageToTag" VALUES (131, 28);
INSERT INTO public."_PageToTag" VALUES (131, 95);
INSERT INTO public."_PageToTag" VALUES (131, 132);
INSERT INTO public."_PageToTag" VALUES (132, 28);
INSERT INTO public."_PageToTag" VALUES (132, 99);
INSERT INTO public."_PageToTag" VALUES (132, 132);
INSERT INTO public."_PageToTag" VALUES (133, 28);
INSERT INTO public."_PageToTag" VALUES (133, 103);
INSERT INTO public."_PageToTag" VALUES (133, 132);
INSERT INTO public."_PageToTag" VALUES (136, 151);
INSERT INTO public."_PageToTag" VALUES (136, 22);
INSERT INTO public."_PageToTag" VALUES (136, 29);
INSERT INTO public."_PageToTag" VALUES (136, 95);
INSERT INTO public."_PageToTag" VALUES (137, 151);
INSERT INTO public."_PageToTag" VALUES (137, 22);
INSERT INTO public."_PageToTag" VALUES (137, 29);
INSERT INTO public."_PageToTag" VALUES (137, 99);
INSERT INTO public."_PageToTag" VALUES (138, 151);
INSERT INTO public."_PageToTag" VALUES (138, 22);
INSERT INTO public."_PageToTag" VALUES (138, 29);
INSERT INTO public."_PageToTag" VALUES (138, 103);
INSERT INTO public."_PageToTag" VALUES (140, 22);
INSERT INTO public."_PageToTag" VALUES (140, 29);
INSERT INTO public."_PageToTag" VALUES (140, 162);
INSERT INTO public."_PageToTag" VALUES (140, 95);
INSERT INTO public."_PageToTag" VALUES (141, 22);
INSERT INTO public."_PageToTag" VALUES (141, 29);
INSERT INTO public."_PageToTag" VALUES (141, 162);
INSERT INTO public."_PageToTag" VALUES (141, 99);
INSERT INTO public."_PageToTag" VALUES (142, 22);
INSERT INTO public."_PageToTag" VALUES (142, 29);
INSERT INTO public."_PageToTag" VALUES (142, 162);
INSERT INTO public."_PageToTag" VALUES (142, 103);
INSERT INTO public."_PageToTag" VALUES (144, 5);
INSERT INTO public."_PageToTag" VALUES (144, 22);
INSERT INTO public."_PageToTag" VALUES (144, 29);
INSERT INTO public."_PageToTag" VALUES (144, 95);
INSERT INTO public."_PageToTag" VALUES (145, 5);
INSERT INTO public."_PageToTag" VALUES (145, 22);
INSERT INTO public."_PageToTag" VALUES (145, 29);
INSERT INTO public."_PageToTag" VALUES (145, 99);
INSERT INTO public."_PageToTag" VALUES (146, 5);
INSERT INTO public."_PageToTag" VALUES (146, 22);
INSERT INTO public."_PageToTag" VALUES (146, 29);
INSERT INTO public."_PageToTag" VALUES (146, 103);
INSERT INTO public."_PageToTag" VALUES (149, 3);
INSERT INTO public."_PageToTag" VALUES (149, 71);
INSERT INTO public."_PageToTag" VALUES (149, 95);
INSERT INTO public."_PageToTag" VALUES (150, 3);
INSERT INTO public."_PageToTag" VALUES (150, 71);
INSERT INTO public."_PageToTag" VALUES (150, 99);
INSERT INTO public."_PageToTag" VALUES (151, 3);
INSERT INTO public."_PageToTag" VALUES (151, 71);
INSERT INTO public."_PageToTag" VALUES (151, 103);
INSERT INTO public."_PageToTag" VALUES (153, 3);
INSERT INTO public."_PageToTag" VALUES (153, 71);
INSERT INTO public."_PageToTag" VALUES (153, 95);
INSERT INTO public."_PageToTag" VALUES (154, 3);
INSERT INTO public."_PageToTag" VALUES (154, 71);
INSERT INTO public."_PageToTag" VALUES (154, 99);
INSERT INTO public."_PageToTag" VALUES (155, 3);
INSERT INTO public."_PageToTag" VALUES (155, 71);
INSERT INTO public."_PageToTag" VALUES (155, 103);
INSERT INTO public."_PageToTag" VALUES (157, 3);
INSERT INTO public."_PageToTag" VALUES (157, 71);
INSERT INTO public."_PageToTag" VALUES (157, 95);
INSERT INTO public."_PageToTag" VALUES (158, 3);
INSERT INTO public."_PageToTag" VALUES (158, 71);
INSERT INTO public."_PageToTag" VALUES (158, 99);
INSERT INTO public."_PageToTag" VALUES (159, 3);
INSERT INTO public."_PageToTag" VALUES (159, 71);
INSERT INTO public."_PageToTag" VALUES (159, 103);
INSERT INTO public."_PageToTag" VALUES (161, 3);
INSERT INTO public."_PageToTag" VALUES (161, 71);
INSERT INTO public."_PageToTag" VALUES (161, 95);
INSERT INTO public."_PageToTag" VALUES (162, 3);
INSERT INTO public."_PageToTag" VALUES (162, 71);
INSERT INTO public."_PageToTag" VALUES (162, 99);
INSERT INTO public."_PageToTag" VALUES (163, 3);
INSERT INTO public."_PageToTag" VALUES (163, 71);
INSERT INTO public."_PageToTag" VALUES (163, 103);
INSERT INTO public."_PageToTag" VALUES (181, 13);
INSERT INTO public."_PageToTag" VALUES (181, 222);
INSERT INTO public."_PageToTag" VALUES (182, 13);
INSERT INTO public."_PageToTag" VALUES (182, 222);
INSERT INTO public."_PageToTag" VALUES (183, 13);
INSERT INTO public."_PageToTag" VALUES (183, 222);
INSERT INTO public."_PageToTag" VALUES (186, 227);
INSERT INTO public."_PageToTag" VALUES (186, 228);
INSERT INTO public."_PageToTag" VALUES (186, 229);
INSERT INTO public."_PageToTag" VALUES (187, 9);
INSERT INTO public."_PageToTag" VALUES (187, 227);
INSERT INTO public."_PageToTag" VALUES (187, 229);
INSERT INTO public."_PageToTag" VALUES (189, 7);
INSERT INTO public."_PageToTag" VALUES (189, 227);
INSERT INTO public."_PageToTag" VALUES (189, 229);
INSERT INTO public."_PageToTag" VALUES (190, 229);
INSERT INTO public."_PageToTag" VALUES (190, 7);
INSERT INTO public."_PageToTag" VALUES (190, 227);
INSERT INTO public."_PageToTag" VALUES (191, 239);
INSERT INTO public."_PageToTag" VALUES (191, 227);
INSERT INTO public."_PageToTag" VALUES (191, 229);
INSERT INTO public."_PageToTag" VALUES (195, 242);
INSERT INTO public."_PageToTag" VALUES (195, 243);
INSERT INTO public."_PageToTag" VALUES (196, 243);
INSERT INTO public."_PageToTag" VALUES (196, 242);
INSERT INTO public."_PageToTag" VALUES (199, 69);
INSERT INTO public."_PageToTag" VALUES (199, 247);
INSERT INTO public."_PageToTag" VALUES (199, 242);
INSERT INTO public."_PageToTag" VALUES (201, 249);
INSERT INTO public."_PageToTag" VALUES (201, 30);
INSERT INTO public."_PageToTag" VALUES (201, 251);
INSERT INTO public."_PageToTag" VALUES (201, 74);
INSERT INTO public."_PageToTag" VALUES (203, 19);
INSERT INTO public."_PageToTag" VALUES (205, 249);
INSERT INTO public."_PageToTag" VALUES (205, 19);
INSERT INTO public."_PageToTag" VALUES (207, 19);
INSERT INTO public."_PageToTag" VALUES (207, 257);
INSERT INTO public."_PageToTag" VALUES (207, 258);
INSERT INTO public."_PageToTag" VALUES (208, 3);
INSERT INTO public."_PageToTag" VALUES (208, 258);
INSERT INTO public."_PageToTag" VALUES (208, 19);
INSERT INTO public."_PageToTag" VALUES (211, 29);
INSERT INTO public."_PageToTag" VALUES (211, 263);
INSERT INTO public."_PageToTag" VALUES (211, 22);
INSERT INTO public."_PageToTag" VALUES (212, 22);
INSERT INTO public."_PageToTag" VALUES (212, 29);
INSERT INTO public."_PageToTag" VALUES (212, 263);
INSERT INTO public."_PageToTag" VALUES (214, 263);
INSERT INTO public."_PageToTag" VALUES (214, 28);
INSERT INTO public."_PageToTag" VALUES (215, 263);
INSERT INTO public."_PageToTag" VALUES (215, 28);
INSERT INTO public."_PageToTag" VALUES (217, 272);
INSERT INTO public."_PageToTag" VALUES (217, 263);
INSERT INTO public."_PageToTag" VALUES (218, 272);
INSERT INTO public."_PageToTag" VALUES (218, 263);
INSERT INTO public."_PageToTag" VALUES (223, 16);
INSERT INTO public."_PageToTag" VALUES (223, 10);
INSERT INTO public."_PageToTag" VALUES (223, 19);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('92181b14-67d1-481a-bfee-cf329ea38791', 'ba4cd30c1f4af819d332dabf8ec5605bf5ea8fbd64b4fa117c801b2ab3a4c1cf', '2025-11-11 20:48:20.981195+05:30', '20251029143312_init', NULL, NULL, '2025-11-11 20:48:20.95079+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('53058a2c-8664-4bd1-82da-0957c7a2891c', '2db460b4bd44e31d5eccf6701ca524e23c118d11422534acaef96992031e1fc4', '2025-11-11 20:48:20.996055+05:30', '20251031095440_add_notification_table', NULL, NULL, '2025-11-11 20:48:20.983103+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('a4223b69-dd3f-4261-8fb2-f82df0824fb6', '2a611cb69ecb04260d99b0d179a2a739337b9c3162908456f8c8656a256d8d83', '2025-11-11 20:48:21.039184+05:30', '20251103141517_add_page_and_tag_models', NULL, NULL, '2025-11-11 20:48:20.997682+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('e30ad397-558f-41d2-b094-39950ffad258', '925fc6c82cc223d9d1bd97cf3fda7e7baac2f3c8b97200ea9f00ce1dcce7809f', '2025-11-11 20:48:21.068476+05:30', '20251107122021_add_group_permissions', NULL, NULL, '2025-11-11 20:48:21.040537+05:30', 1);


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

SELECT pg_catalog.setval('public."Page_id_seq"', 223, true);


--
-- Name: Tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tag_id_seq"', 278, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict onmmhOKxmfn2D1hNBRkAQkxSTRjiWBJdmL6BamAbBaXyDqKw8xhw4DRctHGuPPf

