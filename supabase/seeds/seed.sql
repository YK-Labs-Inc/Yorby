--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'fc9a6649-116b-42aa-b884-98ef1bccdbe6', 'authenticated', 'authenticated', 'pro@test.com', '$2a$06$bc7mQF9YntvB83LmlSR7HOeDfZyc/b8SQVfb0rrpvmT.NE7FfpGlS', '2025-05-11 13:59:28.712948+00', NULL, '', NULL, '', '2025-05-11 13:59:28.712948+00', '', '', NULL, '2025-05-11 13:59:28.712948+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e31f799f-a473-49c0-bd35-a2ff073c3b62', 'authenticated', 'authenticated', 'free@test.com', '$2a$06$UVZ3wWaZj3p2jRKlrL/63eTAdS8TvZ6D6UsicnshLoJKJSYbfeQEy', '2025-05-11 13:59:28.712948+00', NULL, '', NULL, '', '2025-05-11 13:59:28.712948+00', '', '', NULL, '2025-05-11 13:59:28.712948+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9aa1ccb0-0aee-4629-8d68-cb14fc4b9283', 'authenticated', 'authenticated', 'coach@test.com', '$2a$06$KKqcf6VPnbq0aipe28hF8O82eZs0Vk6RyilRXpQehvPZ9f9QrakvK', '2025-05-11 13:59:28.712948+00', NULL, '', NULL, '', '2025-05-11 13:59:28.712948+00', '', '', NULL, '2025-05-11 13:59:28.712948+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '823fd5c1-185c-4ac0-a20e-b783fad3350c', 'authenticated', 'authenticated', 'student@test.com', '$2a$06$EWEY/DG5dqhf2go415Z2JOoBMtgBS2Mn0kYJIiV0PGjkCfw6BTW02', '2025-05-11 13:59:28.712948+00', NULL, '', NULL, '', '2025-05-11 18:29:43.841037+00', '', '', NULL, '2025-05-11 18:29:47.827411+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-11 13:59:28.712948+00', '2025-05-11 18:29:47.830044+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('f7b8f14e-af32-40f4-b31c-83289c31554a', 'fc9a6649-116b-42aa-b884-98ef1bccdbe6', '{"sub": "fc9a6649-116b-42aa-b884-98ef1bccdbe6", "email": "pro@test.com"}', 'email', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '48ab70fd-d999-42c7-b8e1-91b92362f6e1'),
	('112ecec4-0cef-4fc5-8bb0-cc11be0b6cd8', 'e31f799f-a473-49c0-bd35-a2ff073c3b62', '{"sub": "e31f799f-a473-49c0-bd35-a2ff073c3b62", "email": "free@test.com"}', 'email', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '3b360245-284d-4d18-825b-eb8868cdcdcd'),
	('7eafc181-c71c-4155-be79-e7167f18230e', '9aa1ccb0-0aee-4629-8d68-cb14fc4b9283', '{"sub": "9aa1ccb0-0aee-4629-8d68-cb14fc4b9283", "email": "coach@test.com"}', 'email', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', 'cde04280-8626-4e53-b40f-bfd9756ff6bf'),
	('9d41d89a-43ee-4e1f-98c0-32b267e3d109', '823fd5c1-185c-4ac0-a20e-b783fad3350c', '{"sub": "823fd5c1-185c-4ac0-a20e-b783fad3350c", "email": "student@test.com"}', 'email', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', '0cab6cdb-2785-4b8d-b9ee-0e2169e85103');


--
-- Data for Name: coaches; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."coaches" ("id", "user_id", "name", "custom_domain", "created_at", "updated_at", "slug") VALUES
	('9cdc0028-c4ae-49ac-af27-7342c661a802', '9aa1ccb0-0aee-4629-8d68-cb14fc4b9283', 'Tech Sales Jack', NULL, '2025-05-11 13:59:28.712948+00', '2025-05-11 13:59:28.712948+00', 'techsalesjack');

INSERT INTO "public"."coach_branding" ("coach_id", "created_at", "primary_color_hex", "title") VALUES
	('9cdc0028-c4ae-49ac-af27-7342c661a802', '2025-05-11 13:59:28.712948+00', '#101636', 'Tech Sales Jack Academy');


--
-- Data for Name: coach_knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_jobs" ("id", "created_at", "user_id", "job_title", "job_description", "company_name", "company_description", "status", "coach_id", "source_custom_job_id") VALUES
	('eb2c21e3-e184-4f64-8c83-08aa347af965', '2025-05-11 13:59:28.712948+00', 'fc9a6649-116b-42aa-b884-98ef1bccdbe6', 'Senior Software Engineer', 'A general software engineering role focusing on full-stack development.', 'Tech Solutions LLC', 'A dynamic tech company innovating in cloud services.', 'unlocked', NULL, NULl),
	('613da0f7-fc6d-41fc-880e-990cce699911', '2025-05-11 13:59:28.712948+00', 'e31f799f-a473-49c0-bd35-a2ff073c3b62', 'Junior Developer', 'An entry-level developer role focused on learning and contributing to projects.', 'Startup Innovators Inc.', 'A fast-paced startup working on cutting-edge mobile apps.', 'unlocked', NULL, NULL),
	('da89fe98-61f6-4049-bc77-6ad6b576eb0c', '2025-05-11 13:59:28.712948+00', '9aa1ccb0-0aee-4629-8d68-cb14fc4b9283', 'Tech Sales Jack', 'This is a sample job description for the curriculum created by Test Coach.', 'Coach Solutions Inc.', 'A leading provider of interview coaching.', 'unlocked', '9cdc0028-c4ae-49ac-af27-7342c661a802', NULL),
	('90801bef-affb-437d-a33c-cb7494d853b1', '2025-05-11 13:59:28.712948+00', '823fd5c1-185c-4ac0-a20e-b783fad3350c', 'Tech Sales Jack Student', 'This is a sample job description for the curriculum created by Test Coach.', 'Coach Solutions Inc.', 'A leading provider of interview coaching.', 'unlocked', '9cdc0028-c4ae-49ac-af27-7342c661a802', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c');


--
-- Data for Name: custom_job_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_job_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_job_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_job_mock_interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_job_mock_interviews" ("id", "created_at", "custom_job_id", "recording_file_path", "interview_prompt", "status") VALUES
	('36e4d441-86e2-44d1-97fb-04f9fb0bccf0', '2025-05-11 18:32:09.353997+00', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', NULL, 'You are an experienced interviewer for Coach Solutions Inc.. 
You are conducting a job interview for the position of Coach''''s Sample Job.

Company Context:
A leading provider of interview coaching.

Job Description:
This is a sample job description for the curriculum created by Test Coach.

Instructions:
1. Act as a professional interviewer from Coach Solutions Inc..
2. Start by introducing yourself and the company briefly.
3. Ask relevant technical and behavioral questions based on the job description.
4. Evaluate the candidate''s responses and provide constructive feedback.
5. Keep the conversation natural and professional.
6. Ask one question at a time and wait for the candidate''s response.
7. Maintain the role of the interviewer throughout the conversation.

Please begin the interview by introducing yourself and asking your first question.

Conduct your interview with the following set of questions:

Question 1: Tell me about yourself.
Question 2: Why are you interested in this role?
Question 3: What are your strengths?
Question 4: What are your weaknesses?
Question 5: Where do you see yourself in 5 years?

Do your best to ask all of these questions, but if the candidate''s responses lead you to
ask any additional questions, feel free to ask them. It is important for the interview
to be as natural as possible and to follow the flow of the conversation.

Ask natural follow up questions based on the candidate''s responses that will fit the premise
of the job description at the company.

Once you ask 5 questions, end the interview.

Thank the candidate for their time and tell them that the interview has ended. 
', 'in_progress');


--
-- Data for Name: custom_job_mock_interview_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_job_mock_interview_feedback" (
  "id", "created_at", "input_token_count", "output_token_count", "mock_interview_id", "overview", "pros", "cons", "key_improvements", "job_fit_analysis", "job_fit_percentage", "score"
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
  NOW(), 
  0, 
  0, 
  '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 
  'lorem ipsum', 
  '{"lorem ipsum", "lorem ipsum"}', 
  '{"lorem ipsum", "lorem ipsum"}', 
  '{"lorem ipsum", "lorem ipsum"}',
  'lorem ipsum', 
  0, 
  0
);


--
-- Data for Name: custom_job_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_job_questions" ("id", "created_at", "question", "answer_guidelines", "custom_job_id", "question_type") VALUES
	('0faa02fc-d62c-4377-852f-f104c077dd1a', '2025-05-11 13:59:28.712948+00', 'Tell me about yourself.', 'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.', 'eb2c21e3-e184-4f64-8c83-08aa347af965', 'user_generated'),
	('3fa10a73-4fbf-40de-9756-d4e8db73acd2', '2025-05-11 13:59:28.712948+00', 'Why are you interested in this role?', 'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.', 'eb2c21e3-e184-4f64-8c83-08aa347af965', 'user_generated'),
	('3a8728f3-4bb3-4e56-955f-3f3f64b3f1f8', '2025-05-11 13:59:28.712948+00', 'What are your strengths?', 'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.', 'eb2c21e3-e184-4f64-8c83-08aa347af965', 'user_generated'),
	('334303e6-3fc2-4ce4-96c7-2ab073cae628', '2025-05-11 13:59:28.712948+00', 'What are your weaknesses?', 'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.', 'eb2c21e3-e184-4f64-8c83-08aa347af965', 'user_generated'),
	('c61f6320-f6ea-430e-bdc6-a7adf0b17d4d', '2025-05-11 13:59:28.712948+00', 'Where do you see yourself in 5 years?', 'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.', 'eb2c21e3-e184-4f64-8c83-08aa347af965', 'user_generated'),
	('e8431610-314a-4835-b086-22ecc3920d7e', '2025-05-11 13:59:28.712948+00', 'Tell me about yourself.', 'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.', '613da0f7-fc6d-41fc-880e-990cce699911', 'user_generated'),
	('ae8621af-a630-4b60-8280-8de74eef1e46', '2025-05-11 13:59:28.712948+00', 'Why are you interested in this role?', 'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.', '613da0f7-fc6d-41fc-880e-990cce699911', 'user_generated'),
	('05e57fb0-f37d-4fec-8c4a-acf3adb73e41', '2025-05-11 13:59:28.712948+00', 'What are your strengths?', 'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.', '613da0f7-fc6d-41fc-880e-990cce699911', 'user_generated'),
	('f941dd87-ebc1-4b32-9d2c-bffed7cd25f5', '2025-05-11 13:59:28.712948+00', 'What are your weaknesses?', 'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.', '613da0f7-fc6d-41fc-880e-990cce699911', 'user_generated'),
	('c638d30d-1783-4ee5-860e-3de7a3d8b938', '2025-05-11 13:59:28.712948+00', 'Where do you see yourself in 5 years?', 'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.', '613da0f7-fc6d-41fc-880e-990cce699911', 'user_generated'),
	('845e46f3-346e-4ad0-82c4-bcda2c1ddd0a', '2025-05-11 13:59:28.712948+00', 'Tell me about yourself.', 'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('5ede6418-5f6f-4fb0-bfff-b0f3f5b9468b', '2025-05-11 13:59:28.712948+00', 'Why are you interested in this role?', 'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('1bd42739-411d-4b0a-bc79-3bdf050728d2', '2025-05-11 13:59:28.712948+00', 'What are your strengths?', 'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('3cffc37f-e6f4-4bc0-b382-59bda9395e54', '2025-05-11 13:59:28.712948+00', 'What are your weaknesses?', 'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('e9a20659-532c-4862-a6a0-ec7e454e80b2', '2025-05-11 13:59:28.712948+00', 'Where do you see yourself in 5 years?', 'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('5093c031-9de4-475d-b49b-d10be568d799', '2025-05-11 18:29:49.27+00', 'Tell me about yourself.', 'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('2a3046a7-db86-46df-9eff-10cfbda0ff91', '2025-05-11 18:29:49.274+00', 'Why are you interested in this role?', 'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('ae36b68a-e83c-456d-884d-0154d962dd78', '2025-05-11 18:29:49.277+00', 'What are your strengths?', 'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('948bce62-63b9-461f-9157-9772109e7dc3', '2025-05-11 18:29:49.28+00', 'What are your weaknesses?', 'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('874370b0-401e-4f55-9467-916da37ba952', '2025-05-11 18:29:49.284+00', 'Where do you see yourself in 5 years?', 'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('ae735fdb-0bc1-4ec8-bff0-4da52e961211', '2025-05-12 12:57:10.532973+00', 'Tell me about yourself', '📍 Okay, so the first question you''re probably going to get is tell me about yourself. Now this will sound a few different ways, but it''s probably going to be the first thing they ask when you roll into the interview. Hey, you know, small talk, rapport building, where are you from? Cool. Well, hey, I want to get into it.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('2f71479d-a4ec-436e-8440-f0c9084fef11', '2025-05-12 12:57:10.561132+00', 'How do you know Jack?', 'What''s up, fam, by nature of you working with me, by nature of you being in my program, me introducing you to other managers, my name on your resume, you might get asked, who is Jack to you? What''s the nature of your relationship with Jack? So I want to equip you with the response. That''s going to not only help you respond with honesty, but it''s also actually going to help you in the eyes of the manager.

So rather than saying like, Oh, I don''t know. And trying to distance yourself or lying or anything like that. We''re not going to do that. What we''re going to do is just be honest. And we''re going to frame it in a way that makes you look coachable, makes you look like someone who takes herself seriously, that''s serious about results and someone who invests in yourself.

So if someone asks, Hey, who is Jack to you? Hey, I saw Jack made an intro. How do you know Jack? What you need to tell them is that you''re part of a one on one coaching program that I offer where I have been working with you one on one to teach you what life as an SDR is actually like, and I''m training you in all the SDR skills and your workflows and how to do outbound, how to cold call, how to email.

You are learning how to be an SDR under my leadership. And the SDR role you''re doing is instead of a software company, it''s for your job. You''re someone who''s willing to be coached. You''re willing to invest in yourself and you''re willing to do whatever it takes to get the result you want. So you can talk about that, how you''ve sat under my leadership.

I''ve been managing you like an SDR manager or SDR leader would, how you have KPIs you have to hit every day. How we check in every day. Uh, how I''m holding you accountable and how you''re coming back to me with your results. And so what this becomes is, wow, okay, this person isn''t just having someone do the work for them and getting them a job.

No, this person is actually learning how to do the job. They''re being trained by someone who knows what the heck they''re talking about, and they''re willing to be coached. They''re used to the daily disciplines of an SDR role, and they''re willing to invest in themselves to take themselves seriously. So don''t run from it, own it.

I will say the same thing if they ever ask me, I''ve gotten referral calls. Hey, how do you know so and so candidate? I''m just honest. I''m like, yeah, they reached out to me wanting to be coached, wanting to learn how to be an SDR. So I put them into my one on one coaching program where I teach them how to be an SDR with the purpose of us working together is to help them land a job, just like they would be booking meetings with prospects and stuff like that.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('1e939bab-f844-414f-bff3-45c4f37e8d7b', '2025-05-12 12:57:10.568984+00', 'Why are you leaving your current job?', '📍 right after the, tell me about yourself question, they might press you a little bit on why you''re leaving your current role.

And it''s very important here to talk about what you''re running to, not what you''re running from. What I mean by this is you don''t want to talk about you leaving your current employer, like a big Debbie Downer, womp, womp, womp. Like, yeah, this role sucks. I''m I''m door to door. I don''t have any time with my parents.

Uh, the the leadership is really toxic. Like, please do not do that. Okay. What you want to do is you want to talk about how you appreciate the opportunity that you''re currently in and that you''re leaving. Yeah. I feel like I''ve really learned a lot. In this current role, I''ve learned how to insert relevant skills to the SDR role.

I''ve learned how to handle objections. I''ve learned the value of resilience of grit. Uh, I learned, I''ve learned how to be in a team environment and really like invest in my peers and watch that investment come back to me. Um, so it definitely, you know, hasn''t been a terrible experience by any mean, um, by any means, it''s, it''s actually been, uh, really great in many ways.

I''m really grateful for my time there. But what I''m really looking to run to, you hear that you hear how I''m, I''m not ragging on the past and like, I''m trying to get away from this thing. I hate it. Cause that is a weak position to be in. You want to be in a position of strength, of optimism, of hope, of excitement.

And so we''re not going to focus on what we''re running from. We''re going to focus on what we''re excited about, what we''re running to. So, um, however, that being said, um, you know, my goals are insert life. Why? Go back to the, tell me about yourself. My goals are to provide a future for my children, where I am, uh, the provider and the leader that I want to be for my family and in, in the current position I''m in, I know that my growth potential is capped, but what I see over at your company is the opportunity to sell a really freaking good product and be around some high performers.

And I know for me, the next step to my growth and to maximize the potential I have as a seller and as an individual so that I can become. That insert life. Why, or I can achieve insert life. Why, um, that next step for me is to be in an environment like you all have over at a company. That''s it. You don''t need to rag on your employer.

You don''t need to make it sound negative because if you do, I''m going to infer that you''re kind of a pessimistic person. And that is not compatible with the SDR role because this role is hard. I need an eternal optimist, someone who''s always excited about the future. So that being said, um, I want to hear your response.

If someone were to ask you in an interview, Hey, thank you for sharing about yourself and your, your childhood and your life. That''s awesome. Um, can you kind of dig in more for me? Like, why are you leaving [current role]? ', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('0ef6439c-7cd7-4b26-8da8-a4c9dd6d4093', '2025-05-12 12:57:10.575569+00', 'What do you know about our company?', 'This one''s really simple. You can literally just use this script I have over here for you. What do you know about our company? What research did you do for our company? What''s a fun fact you learned about our company? What they''re trying to do is see, did you prepare? So you''re going to blow their socks off with this answer.

Can basically just use this and input your answers. Yeah, absolutely. So from my research, I know you were founded in year. Your last fundraiser was here and you''re a stage X company. CEO is steering the ship and you target persona who struggle with pain and you help by providing value prop. I actually did a little digging and saw a customer story that caught my eye.

It helped me connect the dots where X customer got X result. By partnering with you. So like Kellogg''s got a 15 percent increase in engagement rate by partnering with you. And my research could be off, but I think you all compete with names like competitor and competitor. Am I off on any of that? They''re going to be like, Mike drop, you are going to set yourself apart from the competition so easily and so much by doing this.

So one other thing you can mention is if you did talk to an SCR or an AE. To prep for the interview, you can mention that here. So I also was able to, to speak to Rachel, uh, one of the SDRs over there, and she actually gave me some really good insight and told me that you guys are focused on X big project heading into the new year right now.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('6bf91450-b0d0-4a32-a6dc-8dd3984fe701', '2025-05-12 12:57:10.582042+00', 'What would your last manager say about you?', 'One  of the interview questions you might get asked is how was your relationship with your last manager? This one''s actually super simple to answer, even though it feels intimidating because, Oh no, what if they reach out to my manager? What if they check? What if they ask about me?

They don''t even know I''m applying to this job. They''re not going to do that. So don''t worry about that. They''re not going to reach out without your permission, blah, blah, blah. Okay. So one of two scenarios. is one, you either have a phenomenal relationship with your manager or two, you had a bad relationship.

Maybe you were fired. You were let go. There was drama. There was beef. So when you''re in this situation, this one''s really easy to answer. If you''ve had a good relationship with them, the first thing you want to do is this is a phone number sign because you''re going to tell them to call them. Now, this is kind of in jest.

What this sounds like is during the interview, they ask you this question. Hey, how was your relationship with your last manager? Response is, and again, in jest, it''s like, Oh, it was phenomenal here. Do you want to call them? I can send you their number. And that just shows extreme confidence and security and transparency in the relationship where you''re literally offering their phone number so that they can go ask the manager themselves.

There''s no better way to answer that question. Now, that''s not all you want to say. Again, you want to say, um, yeah, it was, it was phenomenal. In fact, I can give you the number if you want to call them. Um, but here''s what they would probably say. They would probably say I''m the hardest worker in the room.

And they would probably say they really appreciated my proactive communication. Now, the reason that''s important is because one again, SDR always comes down to hard work, but two, it''s showing the interviewers that you''re someone who''s proactive, that you reach out, that you always bring challenges and problems to your manager to help you think through, to get feedback on.

And so you might even drop a specific example, like. I''ll give you an example of our relationship. Uh, one day, you know, out as I was serving, we had this issue with a customer and I wanted to comp their meal, but I wasn''t sure if I was allowed. So I went to my manager, explained the situation and gave two possible solutions.

One, we could comp the meal too, is we could just bring them a dessert. And, uh, my manager helped me think through like, Hey, what''s going to be the best situation or solution in this situation, and, uh, that''s what we were able to do, so I really valued. My partnership that I had with my manager and really viewed my manager as a mentor and as a coach, that is how you want to respond.

If you had a good relationship with your last manager. Now let''s say you had a bad relationship. This one''s a bit trickier. You, you want to be realistic.

You want to be accurate, but you want to be optimistic as well. So what this might sound like is, yeah. Hey, first of all, I value transparency more than anything. So I''m not going to give you some fluffy feel good answer about how incredible that relationship was. Um, it was a tough relationship and here''s why, and maybe you can explain a couple things where like I, I learned so much in that role and where I fell short in the relationship is I fell short in my communication.

I did not vocalize my needs very well to my manager. So my manager was often left confused on where to support me. And even though it felt like I was getting a lack of support, it''s really because I am the one who wasn''t requesting the support. So what you''re trying to do here is give the real scenario.

Hey, my manager didn''t give me much support. That''s the real thing that happened, but you''re taking ownership of it and saying it''s because of me that that happened. Here''s what I learned. I learned that. I need to proactively communicate to my managers to make sure I''m getting the support I need. So as an SDR at company, I''m going to be certain and sure that my manager knows exactly where I''m at by me proactively communicating so that they know how to best support me.

Um, it could be another situation where, I don''t know, maybe you guys disagreed over some stuff, right? So that might sound like. Yeah. Um, again, transparency is the most important thing to me. I''m not going to give you some feel good, fake answer. Um, it was a tough relationship, but I learned a lot from it.

And I think oftentimes in life we learned the most through failure and, you know, me and my, my manager, we actually disagreed on quite a bit, uh, about, you know, X, Y, Z approach or strategy or whatever perspective on the business. Um, and so that definitely caused some tension and conflict. Right. But what I realized is even though I had some good ideas, even though those ideas could have worked and maybe would have worked better, it''s still my responsibility as the direct report to honor and submit to what management is thinking, saying, and doing.

And I learned in that scenario to check my ego at the door. And I learned that I really need to be okay with things not going exactly the way that I want them to, because I know that my manager, they''ve been in that role for a long time. They know what works, they know what doesn''t. I need to make sure that I honor that and respect that while still providing new ideas, but providing new ideas with no expectation that anything happens and being open minded about that. And so what I learned in that scenario, and it is XYZ, so how I plan on leveraging this experience as an SDR at company. Is, you know, I''ve, I''ve learned to just be humble and just realize that leaders are often in those positions because they''ve earned it, they''ve proven through experience and through ownership and demonstration that they''re worthy of being in that role.

So I''m really looking forward to working underneath a leader to learn more, to be coached, and I''m really looking for that mentorship. And I feel like that''s what you guys have. Here that I can be afforded that opportunity. So again, it''s saying the real situation of exactly what happened. But it''s you looking at that situation saying, yep, I was at odds with my manager.

We disagreed on a lot, but here''s how I''m taking ownership. Here''s what I learned. And here''s how that''s going to apply to my role over at your company. That''s the realest way to do it. And when you''re in this situation over here, where you don''t have a good relationship with your manager, what you want to do is say, Hey, look, I''ve got no problem with you guys reaching out to that manager. I can actually provide you their contact information. If you''d like me to, at the same time, I have some other experiences professionally.

I''d be happy to introduce you to those people where I feel like we clicked a little more, we jelled a little more. But again, transparency is my core value. So I''m willing to lay it all on the table for you guys and just have that real conversation. They''re going to appreciate that level of ownership of accountability and transparency.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('e084092e-f3bf-4efb-a1aa-80eeaf0a36e6', '2025-05-12 12:57:10.589157+00', 'How do you handle failure?', 'Can you give me an example of a time you failed or maybe you fell short of a goal? And how you reacted to that situation. Three P framework here sounds something like, yeah. So first off my view of failure is that it''s essential in life. I''ve failed a lot in life and I know learning how to be an elite SDR, it''s going to come with failure and I''m not afraid of that actually really do view failure as an opportunity to grow from every failure I have.

As long as I''m proactively seeking feedback and improving a specific example of failure in my life. Something I''ve learned from you can go personal or professional here. Y''all I''m going to give you both, uh, just as an example. So you can start to think for yourself, but professionally, um, because I''m such a big subscriber of extreme ownership.

As a leader, I take all the responsibility for things on my shoulders. And that negatively impacted the business at my last company and a specific scenario where there was a rep on our team who was not performing, they weren''t hitting quota and it was impacting team performance because of that. But I was under this mantra of always, always, always everything''s my fault.

And I realized that was an over index because what I was missing in that was giving the rep themselves. The autonomy to decide if they were going to work hard for this job or not. And ultimately what happened is I kept that rep on to the team way too long. And what should have been a one or two month performance plan turned into a four month plan.

And that did hurt team performance. And I learned in that moment that I need to be way more decisive and black and white when it comes to performance and managing my SDRs. And so that actually did that, that lesson I learned did help me out, uh, the following quarter because we had a new hire come in to replace that rep.

And unfortunately the new hire was just not who we thought they were going to be. And so, because of my failure before I was able to quickly correct that situation, get that new hire out and bring someone else in and, you know, ultimately how I plan. Using this lesson in the future as an SDR at your company is I need to make black and white decisions.

I need to go by the data and try not to let my feelings get in the way. And I totally plan on doing that. That''s a professional example. Personal, uh, would be something along the lines of for me, like, Uh, I dropped out of college twice. Here''s the situation. I didn''t understand my value, my potential, what I was created for.

I didn''t have a clear plan in life. And because I didn''t have that plan, I wasn''t willing to commit to the work needed to go get the objective. Cause I didn''t have an objective in my mind. So what happened was I dropped out of college twice, found myself, blah, blah, blah. Uh, and then come all the way back to the lesson I learned there is that I''m someone who needs conviction behind what I do, and I need very clear plans in my life and goals.

And so as an SDR at your company, I''m going to be sure that I''m always setting goals and I''m communicating those goals with you, my leader, and with my team, so they can help hold me accountable to those goals.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('f67d559b-189e-4ac4-a382-fab7eb4af3dc', '2025-05-12 12:57:10.594825+00', 'Why did you apply to our company?', '  📍   why did you apply to this company is pretty simple where, um, you''re, you want to talk about two things. You want to talk about the product and then the people. So the product is going to be like, yeah, so you guys sell, uh, two persona cause they have pain and you help by solution value prop. And that''s important to me because, I understand the challenges of pain and I think it''s really cool how you guys are helping them out.', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('c4fc939c-3f89-43e3-a1ec-78c4fd212b07', '2025-05-12 12:57:10.599674+00', 'How are you a learner outside of work?', 'USE 3P FRAMEWORK

Example things you can bring up:

I love podcasts and books, best book I’ve ever read is _____, and I’m currently listening to the _____ podcast to learn more about sales. I’m a big YouTube rabbit hole explorer too, if I ever have questions about how something works, I try to find a video on it. Speaking of, any good books or podcast recommendations that you’d say are a must for anyone on your team?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('78ef72b8-35bf-4605-877d-3311ffc421e0', '2025-05-12 12:57:10.604303+00', 'Give me an example of a time you received coaching', 'USE 3P FRAMEWORK

Example things you can bring up:

All you on this one...pick a legitimate example, own the failure, share that you proactively sought coaching and feedback on it, and how you implemented it after. Also touch on your love for being coached; you are coachable, hungry to learn and grow, and think it’d be an honor to learn from [SDR Manager].', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('f8c33f6d-8bb4-4150-b077-f81d29b47f54', '2025-05-12 12:57:10.610094+00', 'How do you deal with rejection?', 'USE 3P FRAMEWORK

Example things you can bring up:

I don’t mind it at all, I don’t take it personally. In fact, my mindset with rejection is that every no will lead to a yes, so it’d be cool to know, on average, how many no’s I am going to hear before a yes comes, that way the no’s motivate me to keep going, because eventually that yes will come! Besides, I’ve been rejected before in life, I’ve certainly failed at things, but I’ve grown a lot because of it and am grateful for it. In the context of Sales, we’re not going to be the right fit for everyone, and that’s okay, my job is to find the people that are open to learning more. Rejection is part of the gig, I embrace it!', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('bd472fa4-66f7-41c1-ac0b-878d8593a095', '2025-05-12 12:57:10.615942+00', 'Do you have any experience on the phone?', 'USE 3P FRAMEWORK

Example things you can bring up:

Yes. I’ve had experience with being on the phones at _____. Plus, based on my research, it’s the most reliable way to generate consistent pipeline because it’s the quickest way to reach people. I’ve been cold calling SDR managers left and right, I love it! Curious, what % of meetings over there are booked are from calls vs. emails and social?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('1d169e1e-7bc0-4db2-9b1d-c112413f2962', '2025-05-12 12:57:10.620024+00', 'What are you into outside of work?', 'USE 3P FRAMEWORK

Example things you can bring up:

I love podcasts and books, best book I’ve ever read is _____, and I’m currently listening to the _____ podcast to learn more about sales. I’m a big YouTube rabbit hole explorer too, if I ever have questions about how something works, I try to find a video on it. Speaking of, any good books or podcast recommendations that you’d say are a must for anyone on your team?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('3d1277f0-853d-4900-aa36-171a5ed32fcd', '2025-05-12 12:57:10.62464+00', 'How would you prioritize a list of accounts and leads?', 'USE 3P FRAMEWORK

Example things you can bring up:

I’d start with the lowest-hanging fruit first, for example, is there anyone we’ve talked to before that we could reengage? I’d then look for those with relevant triggers, ie, a company hiring, that way I can have a more targeted outbound message. Then I’d reach out to anyone else. Curious, how would you advise your reps to handle a list like that?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('0979bd51-f79e-4f8d-82c8-a4120e9ef2a3', '2025-05-12 12:57:10.629012+00', 'What would you do if you were behind on quota?', 'USE 3P FRAMEWORK

Example things you can bring up:

Ideally, I wouldn’t be in that scenario because I am very proactive - I’d like to think I’d be in close lock-step with you to ensure I had a sound plan and the resources I needed to not fall behind on goal. That being said, the first thing I would do is breathe and detach, acting in fear and from desperation wouldn’t help. Then I would hit up you and my teammates to see what is working well across the team and what I could replicate. Lastly, I would work my BUTT off to fight, scrape, and claw my way to the finish line, even if it meant late nights and 3x effort. Going back to my WHY, failure is not an option for me. I must succeed. Plus, I hate losing more than I love winning. Would you advise your reps any different there?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('c547ba11-997a-4751-b06f-73325610d6fa', '2025-05-12 12:57:10.634423+00', 'What are some questions you''d ask prospects to evaluate if they''re qualified or not?', 'USE 3P FRAMEWORK

Example things you can bring up:

I’d want to really understand the pain that our solution solves for first, and what value we provide to clients. Then based on that, I think I’d have a more educated understanding of who a potential fit is and who isn’t - do you have a strict qualification criteria you adhere to?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('d2a0c74d-4a11-463f-9e79-90829730b9fa', '2025-05-12 12:57:10.639117+00', 'Have you been in customer service roles?', 'USE 3P FRAMEWORK

Example things you can bring up:

I think everything in life is customer service, similar to how everything in life is sales! So yes, I have, for example I _____. My favorite part is getting to interact with people and truly help them. Knowing I am helping people solve genuine issues fires me up. At the same time, general customer service roles don’t reward hard-work, I need to be in a role where my earning and growth potential won’t be kneecapped. In customer service, you don’t get rewarded for putting in more hard work than the average bear, which isn’t the case in sales, and that fires me up even more!', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('2b1d1c37-830d-4fb7-932f-2c60b3988fcb', '2025-05-12 12:57:10.643391+00', 'Are you a team player?', 'USE 3P FRAMEWORK

Example things you can bring up:

Totally, I grew up around teams my whole life like _____. From what I understand, Sales is a team sport, so having peers around me to learn from, grow with, and challenge is a must. By the way, what is team culture like over there? ', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('c96b1431-14bd-4f27-b070-95ab9c1532cc', '2025-05-12 12:57:10.647847+00', 'How would you research a prospect before reaching out?', 'USE 3P FRAMEWORK

Example things you can bring up:

Definitely tools like Apollo, ZoomInfo, and for sure LinkedIn. But worst case, I think using Google and ChatGPT could yield a bit of fruit. On that note, what data tools do you have over there?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
	('5fee01cc-2d72-4343-9588-7f11c52a0189', '2025-05-12 12:57:10.652789+00', 'Do you have any questions for me?', 'All right, time to ask your questions in the interview. At some point in the interview, the manager is going to say, well, what questions do you have for me, this is equally as important as all of your responses. And you need to do a good job here, because when you''re cold calling people, what are you doing? You''re asking questions. You''re doing discovery. You''re being curious. So the disclaimer here is that when a hiring manager gives you the opportunity to ask questions in an interview, they''re looking for two things. Curiosity and business savvy. In 90% of interviews I''ve done as a hiring manager, I have candidates asked the same three questions. What are you looking for in a good hire? What is a culture like? What are the next steps? I can''t tell you. Like, that''s an immediate no. Immediate no. I need someone who''s curious. You''re talking to your future boss, and you''re going to ask those three questions, and that''s. That''s it. Those aren''t bad questions. They''re important to know. But when I hear that over and over and over again, it''s noise to me. It doesn''t mean anything. This is your chance to shine, to show you''re a critical thinker and that you''ve been thoughtful about this role and that you care about quality answers. This is your opportunity to be with your future boss and ask them questions about what you can do as a future SDR to succeed in this role, what they''re looking for, what they need you to be. So we''re going to get into some good questions that will help you do that.So, two very important tips we get before we move on. One is that whenever you ask the hiring manager a question and they respond, you need to come back and validate the response they gave you by sharing an example of how you demonstrate those qualities or saying something to engage with what they just said. The reason why is when you''re cold calling people, you''re going to ask them a question, they''re going to respond. You have to carry the conversation forward. And it''s really awkward in an interview when a rep asked me a question like, ''Hey, what are your top performers doing today?'' And I give them, like, a really nice answer, like, ''Hey, well, they''re very strategic about their accounts and they prioritize their day really well.'' And then the answer I get is like, ''Oh, okay, cool.'' And then they ask the next question that irks me. Because you''re about to be on cold calls. You''re going to ask someone a question, they''re going to answer, and you''re going to be like, ''Oh, okay, cool.'' All right. No, let''s engage with it.

So there''s an example there for you. I want to give you one more example what this might sound like.

''So what challenges do you see ahead for the program? Where do you think the team could come together, plug those gaps?''

''Well, one of our issues right now is we''re not very aligned with our AE team, and it''s leading to a drop in qualified meetings because we''re booking them meetings, but they''re not qualifying them and converting them. So we''re actually not getting credit for as many meetings as we could be. So we''re trying to fix that communication gap. I think if the AEs and SDRs could start having more one-on-ones and getting more aligned, then we''ll see this issue fixed.''

So the bad SDR would just be like, ''Oh. Okay, cool. That''s really interesting. Wow.'' A good SDR is going to say, ''Oh, wow, that''s super interesting. I would love to get aligned with AEs and make sure that we have a plan going into every meeting. What is the ratio over there between AE to SDR?''

The point of what I''m trying to demonstrate to you is you''re going to engage again with that question. You''re going to come back and validate it and you''re not going to just move on to the next question.


Other good examples:
What does your ramp/training program look like?

Where do you see most new hires get stuck, and how can I get ahead of that curve?

How has the team been performing in terms of attainment over the past two quarters?

What challenges do you see ahead for the program, and where do you think the team could come together to plug those gaps?

What are your top reps doing consistently to lead and win?


Are there any resources you would suggest I check out in terms of getting more familiar with the product and market as I go through the interview process?

What caught your eye about my outreach?', 'da89fe98-61f6-4049-bc77-6ad6b576eb0c', 'user_generated'),
('cdbb0af1-1ee3-42e8-9901-cfa342dfcc58', '2025-05-11 13:59:28.712948+00', 'Tell me about yourself.', 'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.', '90801bef-affb-437d-a33c-cb7494d853b1', 'user_generated'),
('7936eaf5-e1e6-4316-81ae-f83ab5ca3e26', '2025-05-11 13:59:28.712948+00', 'Why are you interested in this role?', 'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.', '90801bef-affb-437d-a33c-cb7494d853b1', 'user_generated'),
('55a20866-8315-4aa6-9020-10080a1d5014', '2025-05-11 13:59:28.712948+00', 'What are your strengths?', 'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.', '90801bef-affb-437d-a33c-cb7494d853b1', 'user_generated');


--
-- Data for Name: custom_job_question_sample_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_job_question_sample_answers" ("id", "created_at", "question_id", "answer") VALUES
	('b3de7f19-af19-455d-bda4-74d988efa87a', '2025-05-12 12:57:10.552568+00', 'ae735fdb-0bc1-4ec8-bff0-4da52e961211', 'Yes, so first of all, I just wanted to say thank you so much for the opportunity to interview and, you know, just to share a little bit about myself. Um, I, you know, my family, we didn''t have it easy. Uh, I grew up in a single parent home with my twin sister, and my mom did the best she could, but there was definitely some financial instability that I felt growing up. You know, there was always talk about bills, and I mean, literally, I was just like as a kid, you know, when I find this guy Bill, uh, forgive me, Lord, but I''m going to do him, I''m going to, I''m going to, um, put him in the timeout corner in so many words. Uh, but, you know, that actually formed my life why, and to this day, that''s what motivates me to be successful because I never want my family to have to deal with financial insecurity the way that I did growing up. And I know to do that, I need to work hard and become the best version of myself possible.

So, growing up, I was always super driven. I always had a chip on my shoulder to compete and prove myself, and I found a good amount of success in, um, sports, uh, such as like running track, playing basketball, and then, you know, from a musical perspective, uh, joining a symphony and working my way up from just being a third violinist all the way up to a first violinist to even a concert master for four years. Uh, so I also, you know, took on jobs to work early on to help out around the house and I found myself in sales, and that was one of my first jobs in high school and, uh, just working in retail sales and I I really enjoyed interacting with people, helping them figure out, uh, just what they were looking for and, you know, just giving them that that that breath of fresh air and that peace of mind, um, aspect of it.

But, uh, as I was early in my sales career, I realized that I wasn''t in a position to make the generational impact that I wanted to make for my future, and I wasn''t in a vehicle that was going to allow me to be the provider that I wanted to be for my family. So, that kind of led me to discovering tech sales and I love sales, I love talking to people. I I genuinely love the hunt and I discovered that through my experience and, uh, just door-to-door sales, uh, over the phone inbound outbound sales that, uh, I wanted to be in a position where I had more control over my income, um, where I''d be able to make more of an impact and where I''m surrounded by high performers. And so, I''ve I know I''ve got a lot to learn. Um, you know, and that''s one thing about me, one of my greatest gifts is that I''m a learner. So, I want to surround myself with the best of the best. And that''s what actually brings me, uh, brings me here today with you to interview for this role. You''re not just another company on my list to interview with. Um, I''m genuinely interested in what you guys are doing. Uh, and it''s important for me to feel conviction behind a company I''m working for and, uh, how you''re helping, um, just, you know, uh, persona with pain about value prop, uh, back to script, is a mission that excites me, but even more than that, what you sell, I''m excited about working, uh, with you all. Um, and, uh, that''s why I wanted to just, um,

Okay, I can''t. So, I''m going to stop it right there, but I was kind of like reading what you had provided there, but obviously, I''ll I''ll edit the transcript to, uh, close that out smoothly.'),
	('66cf200e-f3cf-4ea9-89a2-958b3db192fc', '2025-05-12 12:57:10.552568+00', 'ae735fdb-0bc1-4ec8-bff0-4da52e961211', 'Yes, great. So, first, I want to thank you for this opportunity. I''m really, really excited to be here. I''m originally from Stone Mountain, Georgia, and grew up in the same home my parents still live in today, and I''ve always been driven by competition and resilience. So, growing up, my family wasn''t well off, and I faced a lot of challenges in a tough household. Um, but sports became my escape and my discipline and my foundation. My dad was my coach, and I spent years competing across the country, pushing myself to be the best.

That dedication paid off. I was inducted into the Southern University Sports Hall of Fame November 2023, and while in college, I was named SWAC Player of the Year in 20, um, in 2004. So, more than awards, those experiences shaped me into someone who thrives under pressure, um, embraces challenges, and I refuse to settle.

So, after college, um, I started my career in education. I spent years teaching, mentoring, and problem-solving, skills that translate directly into sales. I learned how to communicate with diverse personalities, uh, build trust quickly, and tailor solutions to meet individual needs.

So, later, I stepped away from my career to homeschool my four sons while my husband traveled for work. Um, recently divorced, I''m now focused on rebuilding and proving to myself and to my children that hard work and persistence pays off. Um, so that''s why I transitioned to sales. I need to be in a role where effort directly impacts success. Um, and sales gives me that opportunity.

I''ve already proven my ability to perform. As a sales representative and team lead, I consistently exceeded expectations, closing more deals than the average sales rep. I love the challenge, the competition, and the personal growth that comes with it.

Um, as far as this company, I''ve done my research, and I love how your company is helping businesses streamline operations and improve customer engagement. But beyond that, I really want to be surrounded by high performers. I know that to maximize my potential in sales, I need to be in an environment that pushes me. That''s why I''m excited about this opportunity, and I''d love the chance to contribute, um, and grow with your team.'),
	('02bb6bdb-2d28-4549-a95f-15505f9cc7a0', '2025-05-12 12:57:10.565891+00', '2f71479d-a4ec-436e-8440-f0c9084fef11', 'That is a great question and I''m so glad that you asked. I connected with Jack when I decided I wanted to break into tech sales, but I didn''t want to fake it through interviews. I wanted real experience. So I joined his one-on-one coaching program to learn what being an SDR actually takes. From the start, Jack treated me like I was already in the role. I''ve been cold calling, writing outbound emails, building target lists, and managing a workflow, all with daily KPIs and check-ins. He holds me accountable like a real SDR manager would. What makes it even more valuable is that I''m applying all of this to my job search. So I''m not just practicing, I''m actually prospecting, just with hiring managers instead of software buyers. It''s taught me how to stay focused, coachable, and consistent, and shown me that I''m really serious about doing this job well.'),
	('78a4bb75-e48d-43d3-9b79-d9e9a6b222c6', '2025-05-12 12:57:10.565891+00', '2f71479d-a4ec-436e-8440-f0c9084fef11', 'Yes, so great question. Um, uh, Zach offers a, um, mentorship program, um, that I''m a part of where I receive one-on-one coaching. Uh, and he''s working with me one-on-one to teach me what life is like as an SDR. So, um, actually, uh, getting, um, mentorship, uh, and training on all the SDR skills, uh, such as like workflows, how to do outbound, how to cold call, how to, um, email. Um, and these are things that I''m learning under his leadership, uh, for, uh, the SDR BDR role that I''ll be doing. Um, so, you know, um, for me, like I''m coachable and teachable. And, uh, I believe that your growth stands outside of your comfort zone. So this was an investment that, um, I, I made just being proactive and ensuring that I have a successful career search process. And, um, I sit under Zach''s leadership as I would an SDR manager or SDR leader, uh, in a, uh, tech sales company. And he''s just there to, you know, track, um, uh, how am I, you know, how am I hitting my, uh, KPIs and my metrics every day. And just really holding me accountable, um, so that I get the results and and and push for the results that I''m looking for.'),
	('18bbfac5-ab1e-4310-af4a-2d1b0fd52922', '2025-05-12 12:57:10.565891+00', '2f71479d-a4ec-436e-8440-f0c9084fef11', 'Okay, so yes, how do I know Jack? So Jack is my mentor and sales coach. I joined his one-on-one coaching program to learn the ins and outs of being a successful SDR. Um, through his program, I''ve been trained in key SDR skills, outbound prospecting, cold calling, email outreach, and how to effectively manage my pipeline. Um, he holds me accountable with daily KPIs and just like, pretty much just like I''d have in an actual SDR role. So working with Jack has helped me build strong sales fundamentals, um, develop the right mindset, and prepare to hit the ground running in a SAS sales role. Um, investing in this training was important to me because I really take my career growth seriously, and I want to be the best SDR I can be.'),
	('54505aa6-69b7-43ed-94a3-e9650b917ad8', '2025-05-12 12:57:10.572304+00', '1e939bab-f844-414f-bff3-45c4f37e8d7b', 'Oh yes, so that''s a great question. First, I want to say that I''m really grateful for my time at Legal Case Pro. It was a startup environment with a small sales team when I joined, and it was also a commission-only role. So from day one, I had to ramp up quickly, learn fast, and figure out how to produce results with very little hand-holding. That experience sharpened my ability to work hard, push through challenges, be relentless about hitting my numbers. Um, in fact, I consistently exceeded my quotas, um, by 20% and closed more deals than the average rep because I knew that my success was 100% in my hands. Um, so that said, as I think about the next step in my career, I know I want to be in an environment where I can continue growing, have access to more mentorship, um, work with a team of high performers. Sales has been the perfect path for me because it allows me to take control over my income and success, but I also want to be part of a company that provides the structure, the resources, and, um, the long-term growth opportunities to build a stronger career. Um, so that''s why I''m excited about your company, Modern Campus. Not only is, um, your product solving, your product solving real problems for higher ed institutions, but the team here seems like the kind of high-caliber, uh, growth-minded people I want to learn from, um, and contribute alongside. So I''m looking for a place where I can continue developing as a salesperson, um, be surrounded by the best, and ultimately build a career that allows me to provide for my four sons and my parents. Um, so that''s why I''m excited about this opportunity.'),
	('bb97e6a5-5fba-4a46-8c07-5d48e208addd', '2025-05-12 12:57:10.572304+00', '1e939bab-f844-414f-bff3-45c4f37e8d7b', 'Yeah, another great question. So, first, I''m extremely humble and grateful for the opportunity, for my current opportunity. Um, and, uh, I feel like I''ve really learned a lot in my current role, such as like I''ve learned how to, you know, I''ve learned how to, um, you know, put more, put more time into high-value activities over low-value activities and just, you know, just different sales methodologies when I''m making cold calls, when I''m doing cold email and and social engineering and and connecting, uh, on LinkedIn and other channels of, uh, outreach. Um, and so, you know, um, those, you know, just in that in itself, I''ve also learned like how to handle objections and just the value of resilience, of, uh, having some grit.

And, you know, to add to that, you know, one of the things that really had an impact on me so far is like learning how to be in a team environment and really like invest in, you know, my my colleagues and peers and, uh, just to watch that investment come back to me, um, just through sharp, you know, they say iron sharpens iron. So, it''s definitely, you know, I''ve definitely gotten my return of investment, uh, to say the least, uh, there. And, um, definitely, you know, a lot of great memories and just been extreme extremely grateful for my time, um, here.

But I''m really, I''m, you know, right now where I''m at in my life is, uh, you know, um, you know, I''m just focused on, uh, my goals and that''s just to, you know, be a provider for my family and like I shared, uh, to leave an, leave an inheritance for my son and future kids. And so, uh, in this, you know, future that I''m, that I, that I have a vision for and that I''m focused on, um, to where I''m a provider and a leader, uh, and just being there for my family, you know, right now in my current position, I know that my growth potential is capped, but, uh, what I see over at your company is the opportunity to sell a really, uh, great product and to be around some high performers. And I know for me, the next step, uh, to my growth and to maximize the potential I have as a seller and as an individual is, um, so that I can become that provider and that, you know, live that visionary that I, that I have, uh, for being a family man is to, um, take the next step and to, um, get myself in an environment like you all have over at your company. Um, and, uh, you know, that''s just kind of where, that''s just kind of what brought me, uh, here today and the conversation with you.'),
	('88089ec0-fa00-40fa-8164-2215dd38cc68', '2025-05-12 12:57:10.578424+00', '0ef6439c-7cd7-4b26-8da8-a4c9dd6d4093', 'So absolutely. Um, so about Modern Campus, I did quite a bit of research and I also had the chance to speak with Maverick, a recent hire on the CMS team. He gave me some great insights into what the team is working on and the challenges that you''re solving for higher ed institution institutions. From what I have gathered, Modern Campus was founded in 2016 and recently received private equity investment from Serent Capital. Um, your CEO Peter and your new CRO Eric, um, have been leading the charge and expanding the company''s reach and driving innovation in higher education technology. Your platform is focused on helping higher education institutions, specifically presidents, marketing leaders, IT leaders, registrars, tackle some of their biggest challenges and, um, like declining student enrollment, rising costs, school closures, and the lack of personalized student experiences.

One of the biggest pain points I found, especially when speaking with Maverick, is that many institutions struggle with just outdated websites and CMS platforms. So they want to add new features, but often don''t have the resources to hire software engineers or make continuous updates without hassle. Um, so that''s where Modern Campus really makes, you know, an impact. Your platform provides an all-in-one solution and makes it easier for schools to engage students, of course, streamline processes, uh, create like an Amazon-like personalization, um, to improve enrollment and retention.

Um, I''m especially I''m especially impressed by the stat I found. Um, it''s like a 65% increase in web pages published monthly through Modern Campus CSM, um, CMS, I''m sorry, and a 15% increase in transactions processed for lifelong learning customers. So, those are the kind of results that really show some impact. Um, so you guys got some good things happening over there. And from what I understand, you compete with companies like, I think this is I''m saying it pronounced pronouncing this right, Elucian, um, Salesforce Education Cloud, and Anthology Student. Um, but, um, what sets you guys apart, Modern Campus apart is how you make it easier for institutions to adapt to change, um, without really making massive internal resources, without needing, not making, I''m sorry. Um, so your focus on lifelong learning and student engagement makes your platform a game changer in higher ed. So, I know I just threw out a lot at you. Um, did I get that right or is there anything you''d like to add?'),
	('07c90f9f-0f66-499b-8d88-8db542a28a4c', '2025-05-12 12:57:10.578424+00', '0ef6439c-7cd7-4b26-8da8-a4c9dd6d4093', 'Yeah, absolutely. So, from my research, I know, uh, you were founded in year, your last fund raise was year, and you''re you''re a stage, uh, company. CEO is, uh, staring the ship and you target persona who are struggling with pain and you help by providing value prop. I actually did a little digging and saw a customer story that caught my eye and it helped me connect the dots where customer got result by partnering with you. And my research could be off, but I think you all compete with names like competitor one and competitor two. Am I off on any of that? And, you know, also not for nothing, just in my due diligence, uh, I was able to talk to name and learn XYZ.'),
	('ff03c06d-0c8e-4637-baca-ca8564440937', '2025-05-12 12:57:10.578424+00', '0ef6439c-7cd7-4b26-8da8-a4c9dd6d4093', 'Yeah, absolutely. So, from my research, I know you were found in 2012, your last fundraiser was in 2018. Gino Che is steering the ship and you target companies who are struggling with hiring and help by providing your structured platform. I did some digging and I saw a story where the company Westman Roe stated they are they save over 2500 hours annually with your structured hiring. And I could be off, but I I think you all compete with the companies like Jobvite and Lever, but you are the best. Am I off by any of that?'),
	('a2f0d2ff-ad57-4b17-9831-333641cc2dbb', '2025-05-12 12:57:10.586255+00', '6bf91450-b0d0-4a32-a6dc-8dd3984fe701', 'I''m not going to give you some feel-good fake answer. Um, it was a tough relationship, but I I learned a lot from it. I think often times we learn the most through failure and, you know, me and my manager, we actually disagreed on quite a bit about, you know, how to outreach, you know, in terms of scripting and messaging and and uh top script when they''re picking up the phone and, um, you know, that definitely caused some tension and conflict, right?

But what I realized is even though I had some good ideas and even though those ideas could have worked and maybe would have worked better, it''s still my responsibility as the direct report to honor and submit to what management is thinking, saying, doing. And I learned a lot in that scenario to uh ultimately just check my ego at the door. Uh I learned that I really need to be okay with things not going exactly the way I want them to because I know that my manager, um, they''ve been in that role for a long time. They know what works, they know what doesn''t and I need to make sure that I honor that and respect that while still providing new ideas. Um, and uh despite, you know, providing ideas with no expectations, that happens and just being open-minded about that.

So, you know, what I learned in that scenario is to be humble, um, you know, to check my ego at the door and and absorb the experience, um, from what''s made them successful because they''re trying to duplicate that. And I plan on leveraging this experience as an SDR at uh PV case. Um, I know, uh, as you know, I I''ve learned just to, you know, be humble and just realize that leaders are often in those positions because they''ve earned it. You know, they''ve proven through experience and through ownership and demonstration that they''re worthy of being in that role. So, um, really looking forward to working underneath a leader to learn more, uh to be coached and really looking for that mentorship and I feel like that''s what you guys have, you know, here that I can be afforded that opportunity.

Um, but look, you know, I I I got no problem with you guys reaching out to that manager. I can actually provide you their contact information, uh, if you''d like me to. Uh, at the same time, I have some other experiences professionally. I''d be happy to introduce you to those people where I feel like we clicked more, uh, we gelled, uh, you know, gelled a bit more. Uh, but again, just transparency is my core value. I''m I''m willing to lay it all on the table for you guys and just have that real conversation.'),
	('e5aad97a-85b8-4d2b-9148-bc07ecf6eaac', '2025-05-12 12:57:10.586255+00', '6bf91450-b0d0-4a32-a6dc-8dd3984fe701', 'Honestly, I think my last manager would say I was motivated and willing to learn. But we definitely had some communication gaps. I didn''t always speak up when I needed support, and that led to some confusion. At the time, it felt like I wasn''t getting enough support, but looking back at it, I realize I wasn''t asking for it clearly enough. So since then, I''ve really focused on improving how I communicate. Going into the SDR role at Muckrack, I''ll make sure to be super clear with my manager about where I''m at, what am I working on, and where I might need help. That way, we can stay aligned and I can grow faster.'),
	('f453d253-901f-4a08-9db7-c53d134d45cb', '2025-05-12 12:57:10.586255+00', '6bf91450-b0d0-4a32-a6dc-8dd3984fe701', 'He would say that I''m one of the hardest workers on the team, um, hitting metrics more consistently than anyone else and going out to knock doors in single digit weather with a uh foot of snow even, just to be able to schedule follow-ups follow-up appointments for when the uh the weather was cleared. He''d also say that I was a proactive communicator, reaching out for guidance as often as was needed while filling him in effectively when I was working well on my own initiative.

If you''re interested, I''m happy to offer over his number. You can call him and ask yourself.'),
	('0f66f9e2-7a18-42a9-a75d-bb27adfb43e3', '2025-05-12 12:57:10.592324+00', 'e084092e-f3bf-4efb-a1aa-80eeaf0a36e6', 'Yeah, so, uh, I can I I can draw on a personal experience. So, I dropped out of college and, um, I, you know, a lot of that was because I didn''t understand my value and my potential, uh, and what I was created for, and I didn''t like have a clear plan in life. And because I didn''t have that plan in place, I wasn''t willing to commit to the work needed to, uh, get through all the crazy sciences and all the crazy maths, um, so that I could get that degree and and and get and pursue that career engineering. Um, and so, uh, that, you know, kind of like, you know, stumbled me from achieving my objective because I I didn''t have it in mind. So, what happened was, um, I failed out of college and, um, I just found myself like orbiting through, you know, just job, you know, just, you know, jobs that, um, wasn''t jobs where there was opportunity for me to grow and true mentorship. And so, um, I learned there is, uh, what I learned is that I needed conviction behind what I do and I need a very, uh, I needed very clear plans in my life and goals. So, um, fortunately, I had a college administrator, uh, who was my mentor at the time and he saw something in me that I didn''t see in myself, even after failing out of college. And that was, uh, my first exposure to entrepreneurship. He, um, introduced me to, uh, one of my new mentors and this was someone who was an entrepreneur, um, who was running a business in the travel industry and that''s where I started to learn about personal development and, um, you know, just what it is to have conviction behind what I do and have a clear plan and what I learned from him is if you fail to plan, then you plan to fail. And so from there, you know, I took responsibility, which for me means the accountability to respond and through that, uh, and all I want to communicate is that through that, you know, developing a plan, developing accountability and having conviction and what I was doing and, you know, where I was going, um, entrepreneurship is not easy by any means and I did face a lot of challenge and turmoil, but, um, what what catapulted, uh, my entrepreneurship was just perseverance, um, and this new reset, uh, this new, this new renewed mind, if you will. And what happened was, there were some challenges there in the first, you know, year, but, uh, on the back, on the on the back end of the second six months, um, because of that perseverance and conviction and accountability, um, I was able to, uh, grow, um, the I was able to grow ourselves from a thousand sales in that six-month period. Um, and so, it wouldn''t I wouldn''t have been able to do that had I not, you know, had I not, um, had that mind shift and that paradigm shift. And so, I just wanted to communicate, uh, you know, that, um, you know, as far as goals or concerns with you as my leader and with my team, that, um, you know, my my my outlook on responsibility is my ability to respond and how you do anything is how you do everything and, um, you know, I still carry that with me through today, which is, you know, how I''ve been able to achieve some success, um, thus far.'),
	('f20c9b7d-09cd-46b6-9eae-67f2dc6609e4', '2025-05-12 12:57:10.597329+00', 'f67d559b-189e-4ac4-a382-fab7eb4af3dc', 'Yeah, so, uh, I applied here for two reasons. One is what you guys are actually selling, like your product. So, [provide value or a personal experience or just a personal interest in the product], end of bracket. Um, and then, um, so, uh, also like, uh, what I learned as I research is you that you guys sell to persona because they have pain and you have, you help with value prop. So you''re selling, um, provide, provide perspective. Um, and because of how confusing and how hard it is, providing perspective, uh, you guys are helping as you, uh, streamline all of that and make it very easy. End of providing perspective. Uh, that''s important to me because I was in [provide a personal experience], brackets. Um, and I know how real that is. So that''s one reason, um, it''s, uh, what you guys are selling. I actually believe in it. Like I see the value. Two, uh, is the people you guys, uh, like the people you got, the people you have over there. Uh, it looks like you''ve hired really well. Um, I''ve actually had a chance to, uh, speak with [insert SDR name], [insert SDR name]. And, you know, from the outside looking in, it seems like you guys have brought in some really great talent. And I''m someone who believes in surrounding myself with the best of the best so I can be better. And for those two reasons, that''s what really got me excited to apply.'),
	('f337b93e-ce93-44cf-b630-1d0cbd98e65e', '2025-05-12 12:57:10.597329+00', 'f67d559b-189e-4ac4-a382-fab7eb4af3dc', 'Yeah, so I applied for two reasons. One for your product and secondly, um, the people. And from my research, you guys sell to professional contractors and different industries such as like roofing, remodeling, um, construction, um, because they all face challenges like lengthy estimates, excessive paperwork, and scheduling conflicts. So you all provide them a comprehensive platform that streamlines their workflows and enables them to have faster estimates and, um, efficient document management, all while synchronizing their schedules and ultimately enhancing the customer experience and boosting, um, profits. So that''s really important to me, um, because I''ve worked with different contractors for my own home and they usually have a pen and pad to jot down all their work processes. Um, and they''re they collect their payments through Zelle and by mouth. So there''s no formal, um, documentation. Um, so there''s really no way to track their work. And secondly, the people I have reached out to over there at, um, Leap. Um, for example, um, I talked to um Rio, one of the SDRs and she um helped me ensure that I was reaching out to the accurate um hiring manager um to get more insights about the company and she confirmed the hiring manager to me and that really resonated with me because it showed me that the team is always um willing to help um each other out and I''m all about teamwork and helping my team in any way I can.'),
	('f4ffa8da-0fe1-49a3-9cd1-6612eccd5a93', '2025-05-12 12:57:10.60214+00', 'c4fc939c-3f89-43e3-a1ec-78c4fd212b07', 'Yeah, so first off, my perspective on learning and self-development is, uh, it''s it''s everything. Um, I believe, you know, for me, when I wake up and get out of the bed, my mind works like a parachute, it works the best open. So, uh, when I leave the house, like I don''t, like I don''t leave, I don''t leave close-minded, like, you know, no one would jump out of a plane and not use the parachute. So, um, I''m of the belief that no one''s going to care about my growth as a human more than, um, I am. So, I want to be sure that I''m investing in what I need to invest in to become the best version that I can be.

And so a specific example of something I''ve been learning or I''ve learned recently, uh, is, you know, I''ve been learning, I''ve been sharpening my my skill set as far as sales goes. And I''ve been learning about, um, a new model of selling that''s more of a dialogue approach than a consultative or being a, um, like a pushy closer or a pushy prod or a product pusher. And, um, aside from researching your company and understanding like the case study, uh, particular case study. Um, I do nerd out about some stuff and I really like to go deep, you know, um, like down the rabbit hole, but more personally, I''m currently learning how to trade and invest, um, in the markets. And so, uh, I''m reading books like, um, Unknown Market Wizards, uh, Margin of Safety, and, um, you know, Elliott Wave Theory.

And so one of my biggest takeaways so far, uh, going through, um, trade my my because I''m in a I''m in a trading community, and one of my biggest takeaways so far is, you know, how important trading psychology is because a lot of focus is really on fundamental analysis and technical analysis, but, uh, not a lot of, you know, focus for most traders go into like the psychology aspect of it. And, you know, I just find a lot of similarities between trading and selling, um, just, you know, because, uh, it''s all about, um, you know, it''s all about, uh, creating the right mindset. And, um, ultimately, you know, for me, um, I believe that, um, I''m responsible for everything that happens in my life. So there are factors that they''re like, of course, factors that are going to influence things and yes, other people are involved, but I have to be willing to take accountability for every result I get in my life.

And so that''s been helpful for me because as I think about the SDR role now, um, this is, you know, this is a, uh, this this is, um, like it reminds me of just some of the things and some of the steps in my trading journey. Um, just because at the end of the day, um, if it is to be, it''s up to me, and, um, you know, I just how you do anything is how you do everything. So, uh, at the end of the day, I''m accountable for my results, um, uh, and that''s just, you know, my my outlook on life. Um, you know, and uh, you know, I think like trading kind of is like the iron that sharpens the iron of sales for me.'),
	('6e5e8d43-0897-48fb-96ef-f7c7fc3d37ec', '2025-05-12 12:57:10.607146+00', '78ef72b8-35bf-4605-877d-3311ffc421e0', 'Yeah, so when I actually started in this current inside sales role at Uber Eats, I was eager but struggled with effectively overcoming objections during my cold calls if I''m being honest. And uh this was something that my manager noticed uh and provided coaching to help me refine my approach. And one specific session, my manager gave me actionable feedback on how to reframe objections as opportunities. Uh so for example, if a prospect said, uh we''re already working with um DoorDash, instead of ending the conversation, I learned to respond by asking, um, you know, like, that''s great, you know, what do you like most about your current solution, um, or your current relationship with DoorDash? And so like by practicing this approach during role plays and applying it in live calls, I I was able to see like a a significant improvement in my ability to engage prospects. So like over uh the next, um, over the next quarter, my conversion rate increased by 15%. Um, so since then, I''ve made it a habit to seek out coaching proactively. Um, I schedule by weekly check-ins with my manager outside of our normal, um, check-in to review uh performance and identify areas of growth. I also ask for feedback from peers and uh regularly review call recordings to self-assess. And um, I see coaching as an ongoing process that not only improves my skills, but also helps me contribute more effectively to my team''s goals.'),
	('faf33e7d-db71-4800-89f0-befc89a4b8ea', '2025-05-12 12:57:10.613706+00', 'f8c33f6d-8bb4-4150-b077-f81d29b47f54', 'Yeah, so rejection is definitely one of those inevitable parts of any sales process. And, uh, I personally see it as an opportunity to learn and grow. And my current career search, uh, I''ve approached rejection as an SDR would. In other words, um, I understand that not every outreach will result in a connection and, and that''s okay, um, because for me, rejection isn''t personal. It''s a part of the process. And I found that adopting this mindset helps me stay motivated and focused on my ultimate goal.

Um, a clear example of how I handle rejection is, uh, from my job search, as I mentioned. Um, I''ve treated it like an outbound sales motion. So like cold calling and sending personalized emails to managers and recruiters. Um, many don''t respond and some decline outright, but I just continue to stay persistent. Um, and to increase my chances, I use a multi-touch, uh, multi-threaded approach, combining calls, emails, and follow-ups to engage my audience. And when someone doesn''t engage, uh, I don''t dwell on it. Um, instead, I focus on refining my approach by like identifying new leads and keeping the momentum going.

You know, it''s a numbers game and I''ve learned to detach emotionally while staying committed to my why, which is building a better future for my family. And so like as an SDR, I''ll plan the same strategies. I know there''ll be days when I make 70 to 100 calls and only connect with one person. And, you know, for me, that''s okay because rejection doesn''t define my success. It''s just part of the journey. Uh, my why, uh, rooted in providing a better life for my son and future kids, drives me to push past any obstacles. So when I face rejection, I''ll detach emotionally, uh, evaluate if there''s an opportunity to improve my approach, whether that''s refining my pitch or trying a different tactic, and move on to the next prospect.

Um, you know, I understand we won''t be the right fit for everyone and that''s okay too, you know, uh, because one of my, uh, philosophies is, some will, some won''t, so what, someone''s waiting. But, uh, out of curiosity, uh, how do you coach your SDRs to handle rejection and stay resilient during challenging days?'),
	('70d26a9a-411c-4ca8-8f5a-ab26940c50c5', '2025-05-12 12:57:10.617935+00', 'bd472fa4-66f7-41c1-ac0b-878d8593a095', 'Absolutely. Uh, I do have experience on the phone and I I I personally enjoy it. Um, I view phone conversations as an essential way to build rapport quickly and establish genuine connections with prospects. Uh, there''s a certain energy and immediacy to a live call that''s hard to replicate in other mediums. Um, in my previous role, I handled both inbound and outbound calls, which helped me develop strong phone skills, including active listening and objection handling. Additionally, during my job search, I''ve been approaching it like an SDR, in other words, proactively making cold calls to recruiters and managers. Um, and this process has been invaluable in honing my ability to engage others in a short window and navigate conversations confidently despite facing rejection. So it''s kind of like, you know, putting reps up in the gym for me. Um, you know, but I''m excited to bring that same level of initiative and persistence to this role. I know like cold calls are often the key channel for booking meetings. Uh, but I do love to learn more about how your team is currently operating. Just, you know, out of curiosity, what percentage of meetings are being booked over the phone versus email or social? Um, and I ask just because understanding that could help me tailor my approach to align with what''s working best for the team.'),
	('89a17e6c-74d4-4563-97a6-39bcf7259f64', '2025-05-12 12:57:10.622146+00', '1d169e1e-7bc0-4db2-9b1d-c112413f2962', 'Yeah, so outside of work, I''m all about creating a balanced and fulfilling life. Um, I personally enjoy spending time with my son, which keeps me grounded and reminds me of why I strive to be the best version of myself. I''m also passionate about learning new skills such as trading and investing in commodities and indexes, uh, uh, the S&P 500 in particular, as I find financial literacy empowering and rewarding. Um, recently I''ve been diving into resources and tools to better understand the market and make informed decisions. Um, and it''s been an exciting challenge that has taught me patience and strategy, which are skills I can apply to my professional life as well. Uh, also, I''ve started getting back into the gym and focusing on my health, which has been a great way to build discipline and consistency. And, you know, I''m also rediscovering my passion for travel, which stems from not having had the opportunity to explore much as a child. Now I''m focused on making the most of it by visiting new places, experiencing different cultures. I''m a foodie for sure. Um, and you know, all that helps, you know, me broaden my perspective. And this has given me a greater appreciation for diverse people and ideas, which I personally believe translate well into connecting, uh, connecting with others in a sales role.'),
	('de7adb00-9614-4dc2-a1d6-2f83e1462d0f', '2025-05-12 12:57:10.627144+00', '3d1277f0-853d-4900-aa36-171a5ed32fcd', 'Yeah, so prioritizing a list of accounts is all about maximizing potential impact and efficiency. So I believe in focusing on the highest value opportunities first, while maintaining a systematic approach to ensure no account is neglected. This means looking at factors like account size, industry fit, potential buying signals, and engagement history. So for instance, if certain accounts have shown interest through web visits or email engagement, they would be prioritized higher. Like these would be my low-hanging fruit accounts. And so like for instance, during my career search process, I''ve applied a similar methodology. I''ve identified high-priority companies based on their alignment with my skills and sent personalized outreach messages to decision-makers. I''ve seen better engagement rates when focusing on companies showing signals or excuse me, showing signals of interest or growth, such as hiring sprees or recent funding rounds. So it''s similar to an SDR''s role in identifying and prioritizing the most likely prospects for conversion. So if I were given a list of accounts, I''d follow a structured approach. First, I''d segment the accounts by factors like revenue potential, engagement signals, and industry alignment. You know, so that would look like target accounts and industries where our solution has proven success first. Second, I''d research high-priority accounts to personalize outreach, especially for decision-makers or champions within the organization. And then finally, I''d create a multi-touch engagement strategy starting with high-impact accounts through calls, emails, and social connections, while steadily working through the rest of the list to ensure full coverage. But just out of curiosity, could you walk me through how you would advise your reps to handle that list? Or does the way I''m thinking about it fit the context of how you approach account prioritization here?'),
	('c0dc1cc0-7888-402c-8a0d-38570622ba1f', '2025-05-12 12:57:10.632063+00', '0979bd51-f79e-4f8d-82c8-a4120e9ef2a3', 'I''d like to start off by saying I''m proactive about never getting behind on quota first and foremost. Um, I believe in maintaining consistent effort and discipline, ensuring that I stay on top of my pipeline and activity metrics to prevent any surprises. Uh, that said, I understand that challenges can arise and if I ever find myself behind, my mindset is simple: failure is not an option. Um, again, you know, my why drives me and I need to succeed and I hate losing more than I love winning. Uh, so that deep internal drive ensures I''ll do whatever it takes to hit the goal. So like, for example, in my current career search, I''ve treated uh the process like being an SDR. I''ve been making cold calls, sending emails, and following up relentlessly, even when faced with rejection. Uh, there were moments when I didn''t see the results I wanted right away. So instead of like slowing down, I doubled down. I adjusted my approach, I increased my activity, and stayed laser focused on the goal. And uh the same mindset applies to quota. I''ll fight, scrape, claw, and bleed my way to the finish line whether it means late nights or tripling my efforts. Um, and if I found myself behind, uh I''d take immediate action. First, I''d review my pipeline to identify any gaps or stalled deals and focus on re-engaging those opportunities. Next, I''d increase my outbound efforts such as like, you know, more calls, sending out, you know, more emails and other touch points, while being more strategic to ensure I''m reaching the right prospects. And finally, I''d learn, I excuse me, um, I''d lean into coaching from my manager and peers, you know, just seeking feedback on how I could refine my approach, you know, just staying close to the fire, getting with like the top performers on the team if that''s not me, you know, normally which is the case. Um, but ultimately my goal would be to work smarter and harder, leveraging every single resource available to not only catch up, but to exceed my expectations. But uh, just curious, um, would you advise your reps any differently in that situation? Um, just kind of looking uh to know, um, or learn how do you encourage your team to rally if they find themselves behind?'),
	('be2fb2f8-77d7-446a-b66b-17ac3d30f6e0', '2025-05-12 12:57:10.632063+00', '0979bd51-f79e-4f8d-82c8-a4120e9ef2a3', 'Yeah, that''s that''s a tough one. I think first thing I''d do is I would humble myself, you know, take responsibility and realize that I need to make a change. Uh, I would take a step back, detach myself from the outcome and re-evaluate my approach. I would seek advice from teammates. I''d go to the top performers on the team and I''d ask what what what are you guys doing? Uh, how can I adjust my approach to be better aligned with hitting goals? Um, and obviously I would go to you. I''d I''d communicate that to you and I''d ask you for your advice and for your coaching to really hammer down what uh whatever I whatever it is I''m I''m missing. And I would work my ass off. Uh I''ll I would put in extra hours if need be to make sure that I''m hitting those quotas and exceeding those quotas.'),
	('0761c082-fc1b-4c02-964b-b926d960f18e', '2025-05-12 12:57:10.636728+00', 'c547ba11-997a-4751-b06f-73325610d6fa', 'Yeah, so to evaluate if a prospect is qualified, I focus on uncovering their pain points, you know, in other words, understanding their current processes and assessing their readiness for a solution. I see qualification as not just checking boxes, but genuinely ensuring there''s a mutual fit and potential for a partnership. So like asking the right questions early ensures I invest my time wisely and deliver value.

For example, in my recent outreach efforts during my job search, I''ve treated each conversation like a discovery call. So when cold calling hiring managers, I ask tailored questions to gauge their immediate hiring needs and their openness to considering candidates with my background. By doing this, I''ve been able to determine which opportunities are worth pursuing and prioritize them accordingly.

So, um, in a professional SDR role, I''d take a similar approach by asking thoughtful questions like, uh, what are your biggest challenges related to, um, specific area tied to the solution? Um, so, you know, by asking that question, it helps me identify pain points and urgency. You know, I''d ask like, what tools or processes are you currently using to address this? Um, this, um, helps me evaluate, uh, their current setup and potential gaps. Uh, I''d also be curious to know what an ideal solution looked like to them. Uh, this would, you know, reveal if our offering aligns with their needs.

I want to know who else is typically involved in making decision for tools like, um, what we solve for. Uh, that way, uh, it qualifies their authority and decision-making process. And, you know, um, lastly, you know, I''d also want to know like what their timeline for addressing the the challenge is because that helps me assess their readiness to act. Um, but for the most part, I always ensure my questions are conversational and natural to avoid interrogating the prospect because, um, people, um, you know, people hate that. I know I personally hate, you know, that.

So like after qualifying them, I''d summarize their answers to confirm alignment and maintain transparency. But, um, with that being said, do y''all have a strict qualification criteria that you adhere to or would you recommend a different approach to qualify prospects more effectively?'),
	('dadf86b1-0519-42e5-92ab-17b4c6274760', '2025-05-12 12:57:10.641284+00', 'd2a0c74d-4a11-463f-9e79-90829730b9fa', 'Yes, I''ve held customer service roles in the telecommunication and health industries and um my, you know, in my uh beginning in the very early beginning um of uh just, you know, working jobs. And so like experiences like these taught me valuable skills such as communication, active listening, and problem-solving, which are directly transferable to a sales environment. Uh with that being said, I realized that while customer service has been a strong foundation, uh it doesn''t provide the level of reward and career progression that I''m personally seeking. That''s what led me to pursue a career in tech sales. Um, you know, I''m drawn to the fast-paced, results-driven nature of the role and the opportunity to directly impact business outcomes. And, you know, just to share a little bit of my previous customer service roles, uh I consistently exceeded performance metrics like customer service, excuse me, customer satisfaction scores and issue resolution times. For example, that time on the cable, I improved customer retention by 15% through proactive communication and identifying upsell opportunities, which gave me a taste of the impact I could have in a sales role. And additionally, I''ve gained experience in handling objections, building rapport, and understanding customer needs. You know, all skills that align perfectly with the responsibilities of an SDR. So, you know, my plan is now to leverage my customer service background as a stepping stone into tech sales. I''ve act I''ve been actively upskilling such as learning about um different tech stacks like Salesforce or prospecting strategies. Um and I''ve been treating my job search like an SDR would, in other words, identifying prospects, personalizing outreach, and handling rejection. So, you know, all that to say, I''m committed to channeling my passion for results and continuous learning into becoming an impactful SDR.

Uh but, you know, you know, just out of curiosity, uh could you um, you know, could you uh do you see like customer service as a valuable asset for an SDR and how does it align with your team''s approach?'),
	('5ac7b0b7-ab20-4bc2-9bec-d5afb9d409ac', '2025-05-12 12:57:10.645292+00', '2b1d1c37-830d-4fb7-932f-2c60b3988fcb', 'Absolutely. I definitely consider myself a team player. One of one of my mottos is one team, one dream. So to me, being a team player means understanding that individual contributions only shine when they align with and elevate the team''s goals. Success is always better when shared and collaboration fosters creativity and resilience in my experience.

Um, you know, for me, I''ve had the privilege of being a part of various teams including sports teams and a symphony orchestra for over 14 years. Uh, these experiences not only taught me the importance of coordination and trust, but also how to adapt my role based on the needs of the group. And in many cases, I''ve stepped into leadership roles where I had to motivate teammates, communicate goals effectively, and ensure everyone was aligned, whether it was leading my team on the field, uh, or on the track rather, and on the basketball court, or guiding a section in the orchestra, um, where there''s a section of, um, a piece of music where something''s flat or too sharp. Uh, I always prioritize harmony and collective success over individual accolades. Um, and, you know, as a sales development representative, I plan to bring the same team-oriented mindset to the role, whether it''s collaborating with marketing to align on outreach strategies, sharing best practices with fellow SDRs, or working closely with the account executives to ensure leads are nurtured effectively. I''m ready to support and contribute to a high-performing team.

Uh, which, you know, brings me to ask you, uh, what is team culture like over there? Um, you know, like how do you foster collaboration among SDRs and across departments?'),
	('6c42c82a-acfe-436f-81cd-d3449f5eb476', '2025-05-12 12:57:10.650632+00', 'c96b1431-14bd-4f27-b070-95ab9c1532cc', 'Yeah, so when approaching uh prospect research, I believe it''s crucial to gather as much relevant information as possible to personalize my outreach and increase my chances of engagement. So understanding a prospect''s business, the industry, like the challenges that they''re facing, and also their needs allows me to tailor my messaging effectively and show that I''ve done my research. So I''ve used a variety of research tools throughout my career to build targeted lists and better understand prospects. For instance, I''ve utilized platforms like ZoomInfo and LinkedIn Sales Navigator to access company data and decision maker details. I also use Apollo, which is how I found you, um, to gather relevant insight and track engagement. Additionally, tools like Gong and HubSpot help me understand prior interactions and messaging strategies, which I incorporate into my outreach. And with these tools, I''ve been able to optimize my outreach efforts and see significant successes in connecting with prospects. Um, my research process starts with identifying the right prospect based on criteria like company size, industry, and decision maker, uh, like the like the decision maker role, whether that''s above the line or below the line. From there, I dive into the their online presence, including company websites, LinkedIn profiles, and recent news. Um, I personally like to aim to uncover pain points or areas where my solution can provide value. Uh, so after gathering insights, I tend to tailor my messaging to reflect the prospect''s needs, often like using a multi-channel approach through emails, calls, and social touches. For example, if I notice a recent product launch or industry industry shift, I''ll incorporate that into my outreach to demonstrate relevance and understanding. But, uh, obviously, you all have a data tool over there. Um, curious to know what you all are currently using.'),
	('d9a97c1a-f0ad-4516-93b5-ebd446473e0b', '2025-05-12 12:57:10.654945+00', '5fee01cc-2d72-4343-9588-7f11c52a0189', 'So, what are your top reps doing consistently to lead and win? Well, they''re disciplined and don''t give up. Amazing. I wouldn''t be connecting with you today if I weren''t a disciplined person, and giving up is not an option for me. In fact, nothing short of excellence is acceptable in my book.

What challenges do you see ahead of the program and where do you think the team could come together to close the gaps?

Well, our AE and SCR teams aren''t in communication as readily as they need to be, and this is causing a drop off in the amount of discovery calls booked.

Well, in this role, I would be looking to open up communication channels, build relationships with the AE staff and my SCR colleagues, and help you close the gap so we can increase the amount of discovery calls and ultimately close more deals.');


--
-- Data for Name: custom_job_question_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_job_question_submissions" ("id", "created_at", "custom_job_question_id", "answer", "feedback") VALUES
	('11111111-1111-1111-1111-111111111111', NOW(), 'cdbb0af1-1ee3-42e8-9901-cfa342dfcc58', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('22222222-2222-2222-2222-222222222222', NOW(), '7936eaf5-e1e6-4316-81ae-f83ab5ca3e26', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('33333333-3333-3333-3333-333333333333', NOW(), '7936eaf5-e1e6-4316-81ae-f83ab5ca3e26', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('44444444-4444-4444-4444-444444444444', NOW(), '7936eaf5-e1e6-4316-81ae-f83ab5ca3e26', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('55555555-5555-5555-5555-555555555555', NOW(), '7936eaf5-e1e6-4316-81ae-f83ab5ca3e26', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('66666666-6666-6666-6666-666666666666', NOW(), '55a20866-8315-4aa6-9020-10080a1d5014', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('77777777-7777-7777-7777-777777777777', NOW(), '55a20866-8315-4aa6-9020-10080a1d5014', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('88888888-8888-8888-8888-888888888888', NOW(), '55a20866-8315-4aa6-9020-10080a1d5014', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}'),
	('99999999-9999-9999-9999-999999999999', NOW(), '55a20866-8315-4aa6-9020-10080a1d5014', 'lorem ipsum', '{"pros": ["lorem ipsum", "lorem ipsum"], "cons": ["lorem ipsum", "lorem ipsum"]}');


--
-- Data for Name: demo_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: demo_job_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: email_waitlist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interview_copilot_demo_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interview_copilots; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interview_copilot_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interview_copilot_questions_and_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mock_interview_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--
INSERT INTO "public"."mock_interview_messages" (
  "id", "created_at", "mock_interview_id", "role", "text"
) VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'user',  'lorem ipsum dolor sit amet.'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'model', 'lorem ipsum dolor sit amet.'),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'user',  'lorem ipsum dolor sit amet.'),
  ('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbb4', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'model', 'lorem ipsum dolor sit amet.'),
  ('bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbb5', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'user',  'lorem ipsum dolor sit amet.'),
  ('bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'model', 'lorem ipsum dolor sit amet.');



--
-- Data for Name: mock_interview_question_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--
INSERT INTO "public"."mock_interview_question_feedback" (
  "id", "created_at", "mock_interview_id", "question", "answer", "pros", "cons", "score"
) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'lorem ipsum?', 'lorem ipsum', '{"lorem ipsum", "lorem ipsum"}', '{"lorem ipsum", "lorem ipsum"}', 4),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'lorem ipsum?', 'lorem ipsum', '{"lorem ipsum", "lorem ipsum"}', '{"lorem ipsum", "lorem ipsum"}', 3),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'lorem ipsum?', 'lorem ipsum', '{"lorem ipsum", "lorem ipsum"}', '{"lorem ipsum", "lorem ipsum"}', 5),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'lorem ipsum?', 'lorem ipsum', '{"lorem ipsum", "lorem ipsum"}', '{"lorem ipsum", "lorem ipsum"}', 2),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaa5', NOW(), '36e4d441-86e2-44d1-97fb-04f9fb0bccf0', 'lorem ipsum?', 'lorem ipsum', '{"lorem ipsum", "lorem ipsum"}', '{"lorem ipsum", "lorem ipsum"}', 4);



--
-- Data for Name: referral_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: referral_redemptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_detail_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_edits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_item_descriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_list_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscriptions" ("id", "created_at", "stripe_customer_id") VALUES
	('fc9a6649-116b-42aa-b884-98ef1bccdbe6', '2025-05-11 13:59:28.712948+00', 'cus_RyiHFVvbxDGyWO');


--
-- Data for Name: user_coach_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_coach_access" ("user_id", "coach_id", "created_at") VALUES
	('823fd5c1-185c-4ac0-a20e-b783fad3350c', '9cdc0028-c4ae-49ac-af27-7342c661a802', '2025-05-11 18:29:49.246955+00');


--
-- Data for Name: user_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."coach_knowledge_base" ("created_at", "coach_id", "knowledge_base") VALUES
	('2025-05-11 18:34:54.405511+00', '9cdc0028-c4ae-49ac-af27-7342c661a802', 'Interview Question Framework: Triple P or 3P

Almost every other interview question you''ll be asked, you can use the triple P framework:

1. Perspective - Give your perspective on that topic
2. Proof - Provide proof that you''ve done it
3. Plan - Explain your plan for how you''ll do it in the SDR role

Example Questions

* How are you a learner outside of work?
* How do you handle failure or rejection?
* How do you handle feedback and coaching?
* How are you in a team environment?

They''re looking for certain "right" answers, but just saying what they want to hear isn''t enough. You need to show it.

Example Answer for “How do you handle failure?”

Perspective

"My perspective on failure is that it''s the only way to learn and grow. I welcome failure, but I don''t like failing twice at the same thing. Every ''no'' is an opportunity to learn."

Proof

"An example of how I handled failure was not making the freshman basketball team. I realized I hadn''t practiced enough, so I invested heavily in training that summer."

Plan

"As an SDR, I plan to navigate failure by not taking ''no'' personally, knowing each ''no'' gets me closer to a ''yes''. I''ll seek feedback and learn from successful scripts."

Example answer for “How do you handle rejection?”

Perspective: Rejection is just part of the process, like finding the ''X'' in a sea of ''O''s.

Proof: In door-to-door sales, I expect 80-90 ''no''s out of 100 doors. I approach each one positively, knowing it could be the ''yes''.

Plan: As an SDR, I''ll view each ''no'' as one step closer to a ''yes'', while learning from top performers how to turn ''no''s and ''maybes'' into ''yes''s.

Example answer for “how do you manage your time?”

Perspective: Organization and time management are crucial for balancing multiple priorities.

Proof: I use a detailed calendar for my job search, scheduling specific times for applications, interviews, skill development, and personal commitments.

Plan: As an SDR, I''ll use time blocking for follow-ups, adding new leads, call blocks, and breaks. I''d be happy to show you my current calendar as an example of my organizational skills.

Remember, you don''t need to explicitly say "perspective, proof, plan" - it''s just a framework to structure your answers effectively. 

STAR Method

You can also use the STAR method, as some companies prefer the STAR method:

* Situation (20% of answer)
* Task (10%)
* Action (60%)
* Results (10%)

Example: "Tell me about a time you set and achieved a goal"

Situation

"As a sophomore, I wanted to make the varsity football team."

Task

"I had to gain weight and strength to compete with older players."

Action

"I told friends and family about my goal for accountability. I set a strict schedule with 5am alarms, regimented workouts and eating plan, and got consistent coaching."

Results

"I gained 15 pounds, reaching my 190 pound goal, and made the varsity team.”');