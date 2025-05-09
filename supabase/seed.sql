-- User: pro@test.com (with subscription)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'pro@test.com',
    crypt('password', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM auth.users WHERE email = 'pro@test.com'),
    format(
        '{"sub":"%s","email":"%s"}',
        (SELECT id FROM auth.users WHERE email = 'pro@test.com')::text,
        'pro@test.com'
    )::jsonb,
    'email',
    uuid_generate_v4(),
    current_timestamp,
    current_timestamp,
    current_timestamp
  );

INSERT INTO public.subscriptions (
    id, -- User ID from auth.users
    stripe_customer_id,
    created_at
  )
VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'pro@test.com'),
    'cus_RyiHFVvbxDGyWO',
    current_timestamp
  );

-- Add a custom job and questions for pro@test.com (B2C user)
WITH pro_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'pro@test.com'
),
inserted_pro_custom_job AS (
  INSERT INTO public.custom_jobs (
      id,
      coach_id, -- This will be NULL for B2C users
      user_id, -- This is the pro user's auth.users.id
      job_title,
      job_description,
      company_name,
      company_description,
      status,
      created_at
    )
  SELECT
    uuid_generate_v4(),
    NULL, -- No coach_id for B2C user
    (SELECT user_id FROM pro_user),
    'Senior Software Engineer',
    'A general software engineering role focusing on full-stack development.',
    'Tech Solutions LLC',
    'A dynamic tech company innovating in cloud services.',
    'unlocked',
    current_timestamp
  RETURNING id
)
INSERT INTO public.custom_job_questions (
    id,
    custom_job_id,
    question,
    answer_guidelines,
    question_type,
    created_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_pro_custom_job),
    'Tell me about yourself.',
    'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_pro_custom_job),
    'Why are you interested in this role?',
    'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_pro_custom_job),
    'What are your strengths?',
    'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_pro_custom_job),
    'What are your weaknesses?',
    'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_pro_custom_job),
    'Where do you see yourself in 5 years?',
    'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.',
    'user_generated',
    current_timestamp
  );

-- User: free@test.com (no subscription)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'free@test.com',
    crypt('password', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM auth.users WHERE email = 'free@test.com'),
    format(
        '{"sub":"%s","email":"%s"}',
        (SELECT id FROM auth.users WHERE email = 'free@test.com')::text,
        'free@test.com'
    )::jsonb,
    'email',
    uuid_generate_v4(),
    current_timestamp,
    current_timestamp,
    current_timestamp
  );

-- Add a custom job and questions for free@test.com (B2C user)
WITH free_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'free@test.com'
),
inserted_free_custom_job AS (
  INSERT INTO public.custom_jobs (
      id,
      coach_id, -- This will be NULL for B2C users
      user_id, -- This is the free user's auth.users.id
      job_title,
      job_description,
      company_name,
      company_description,
      status,
      created_at
    )
  SELECT
    uuid_generate_v4(),
    NULL, -- No coach_id for B2C user
    (SELECT user_id FROM free_user),
    'Junior Developer',
    'An entry-level developer role focused on learning and contributing to projects.',
    'Startup Innovators Inc.',
    'A fast-paced startup working on cutting-edge mobile apps.',
    'unlocked',
    current_timestamp
  RETURNING id
)
INSERT INTO public.custom_job_questions (
    id,
    custom_job_id,
    question,
    answer_guidelines,
    question_type,
    created_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_free_custom_job),
    'Tell me about yourself.',
    'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_free_custom_job),
    'Why are you interested in this role?',
    'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_free_custom_job),
    'What are your strengths?',
    'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_free_custom_job),
    'What are your weaknesses?',
    'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_free_custom_job),
    'Where do you see yourself in 5 years?',
    'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.',
    'user_generated',
    current_timestamp
  );

-- User: coach@test.com (no subscription)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'coach@test.com',
    crypt('password', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM auth.users WHERE email = 'coach@test.com'),
    format(
        '{"sub":"%s","email":"%s"}',
        (SELECT id FROM auth.users WHERE email = 'coach@test.com')::text,
        'coach@test.com'
    )::jsonb,
    'email',
    uuid_generate_v4(),
    current_timestamp,
    current_timestamp,
    current_timestamp
  );

-- Entry for coach@test.com in the coaches table
INSERT INTO public.coaches (
    id,
    user_id,
    name,
    slug,
    created_at,
    updated_at,
    branding_settings,
    custom_domain
  )
VALUES
  (
    '9cdc0028-c4ae-49ac-af27-7342c661a802', -- Hardcoded coach ID
    (SELECT id FROM auth.users WHERE email = 'coach@test.com'),
    'Test Coach',
    'test-coach',
    current_timestamp,
    current_timestamp,
    NULL,
    NULL
  );

-- Clear existing data for coach@test.com's custom job and questions
DELETE FROM public.custom_job_questions
WHERE custom_job_id IN (
  SELECT cj.id
  FROM public.custom_jobs cj
  WHERE cj.coach_id = '9cdc0028-c4ae-49ac-af27-7342c661a802' -- Hardcoded coach ID
    AND cj.user_id = (SELECT id FROM auth.users WHERE email = 'coach@test.com') -- Coach's user_id
);
DELETE FROM public.custom_jobs
WHERE coach_id = '9cdc0028-c4ae-49ac-af27-7342c661a802' -- Hardcoded coach ID
  AND user_id = (SELECT id FROM auth.users WHERE email = 'coach@test.com'); -- Coach's user_id

-- Add a custom job and questions for coach@test.com
WITH coach_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'coach@test.com'
),
inserted_custom_job AS (
  INSERT INTO public.custom_jobs (
      id,
      coach_id, -- This will be the hardcoded coach ID
      user_id, -- This is the coach's auth.users.id
      job_title,
      job_description,
      company_name,
      company_description,
      status,
      created_at
    )
  SELECT
    uuid_generate_v4(),
    '9cdc0028-c4ae-49ac-af27-7342c661a802', -- Hardcoded coach ID
    (SELECT user_id FROM coach_user),
    'Coach''''s Sample Job',
    'This is a sample job description for the curriculum created by Test Coach.',
    'Coach Solutions Inc.',
    'A leading provider of interview coaching.',
    'unlocked',
    current_timestamp
  RETURNING id
)

INSERT INTO public.custom_job_questions (
    id,
    custom_job_id,
    question,
    answer_guidelines,
    question_type,
    created_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_custom_job),
    'Tell me about yourself.',
    'Structure your answer to be a brief, compelling summary of your professional background, key skills, and career aspirations. Relate your story to the job you''''re applying for.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_custom_job),
    'Why are you interested in this role?',
    'Demonstrate genuine interest by highlighting specific aspects of the role, company, or industry that appeal to you. Connect your skills and experience to the job requirements.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_custom_job),
    'What are your strengths?',
    'Identify 2-3 key strengths that are relevant to the job. Provide specific examples of how you''''ve used these strengths to achieve positive outcomes in previous roles.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_custom_job),
    'What are your weaknesses?',
    'Choose a real weakness, but frame it positively by discussing steps you''''re taking to improve. Avoid clichés or mentioning weaknesses critical to the role.',
    'user_generated',
    current_timestamp
  ),
  (
    uuid_generate_v4(),
    (SELECT id FROM inserted_custom_job),
    'Where do you see yourself in 5 years?',
    'Show ambition and that you''''ve thought about your career path. Align your goals with the opportunities the company might offer, emphasizing growth and contribution.',
    'user_generated',
    current_timestamp
  );

-- User: student@test.com (no subscription)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'student@test.com',
    crypt('password', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM auth.users WHERE email = 'student@test.com'),
    format(
        '{"sub":"%s","email":"%s"}',
        (SELECT id FROM auth.users WHERE email = 'student@test.com')::text,
        'student@test.com'
    )::jsonb,
    'email',
    uuid_generate_v4(),
    current_timestamp,
    current_timestamp,
    current_timestamp
  );