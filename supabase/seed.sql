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