CREATE TABLE IF NOT EXISTS "PendingRegistration" (
  "id"              TEXT NOT NULL,
  "payload"         JSONB NOT NULL,
  "stripeSessionId" TEXT,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PendingRegistration_stripeSessionId_key"
  ON "PendingRegistration" ("stripeSessionId");

CREATE INDEX IF NOT EXISTS "PendingRegistration_stripeSessionId_idx"
  ON "PendingRegistration" ("stripeSessionId");
