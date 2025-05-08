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
    uuid_generate_v4(),
    (SELECT id FROM auth.users WHERE email = 'coach@test.com'),
    'Test Coach',
    'test-coach',
    current_timestamp,
    current_timestamp,
    NULL,
    NULL
  );

-- Add a custom job and questions for coach@test.com
WITH coach_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'coach@test.com'
),
coach_profile AS (
  SELECT id AS coach_id FROM public.coaches WHERE user_id = (SELECT user_id FROM coach_user)
),
inserted_custom_job AS (
  INSERT INTO public.custom_jobs (
      id,
      coach_id,
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
    (SELECT coach_id FROM coach_profile),
    (SELECT user_id FROM coach_user),
    'Coach''s Sample Job',
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
    question_type, -- Assuming question_type enum type
    created_at
  )
SELECT
  uuid_generate_v4(),
  (SELECT id FROM inserted_custom_job),
  'Sample Question ' || s.i || ' for Coach''s Job',
  'Guidelines for Sample Question ' || s.i || '. Focus on clarity and structure.',
  'ai_generated',
  current_timestamp
FROM generate_series(1, 10) AS s(i);

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