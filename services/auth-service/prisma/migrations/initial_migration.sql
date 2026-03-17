
[+] Added Schemas
  - public

[+] Added enums
  - UserStatus
  - SessionStatus
  - TokenType
  - TokenStatus

[+] Added tables
  - users
  - sessions
  - refresh_tokens
  - password_resets
  - email_verifications
  - audit_logs

[*] Changed the `audit_logs` table
  [+] Added index on columns (userId)
  [+] Added index on columns (action)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (userId)

[*] Changed the `email_verifications` table
  [+] Added unique index on columns (tokenHash)
  [+] Added index on columns (userId)
  [+] Added index on columns (email)
  [+] Added index on columns (tokenHash)
  [+] Added index on columns (status)
  [+] Added index on columns (expiresAt)
  [+] Added foreign key on columns (userId)

[*] Changed the `password_resets` table
  [+] Added unique index on columns (tokenHash)
  [+] Added index on columns (userId)
  [+] Added index on columns (tokenHash)
  [+] Added index on columns (status)
  [+] Added index on columns (expiresAt)
  [+] Added foreign key on columns (userId)

[*] Changed the `refresh_tokens` table
  [+] Added unique index on columns (tokenHash)
  [+] Added index on columns (userId)
  [+] Added index on columns (tokenHash)
  [+] Added index on columns (expiresAt)
  [+] Added index on columns (isRevoked)
  [+] Added foreign key on columns (userId)

[*] Changed the `sessions` table
  [+] Added unique index on columns (jti)
  [+] Added index on columns (userId)
  [+] Added index on columns (jti)
  [+] Added index on columns (status)
  [+] Added index on columns (expiresAt)
  [+] Added foreign key on columns (userId)

[*] Changed the `users` table
  [+] Added unique index on columns (email)
  [+] Added unique index on columns (googleId)
  [+] Added unique index on columns (facebookId)
  [+] Added index on columns (email)
  [+] Added index on columns (status)
  [+] Added index on columns (emailVerified)
  [+] Added index on columns (googleId)
  [+] Added index on columns (facebookId)
  [+] Added index on columns (role)
