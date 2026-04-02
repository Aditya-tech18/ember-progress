-- =====================================================
-- MENTOR SESSIONS PURCHASES TABLE
-- Stores all mentor session bookings with payment details
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_session_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    student_email TEXT NOT NULL,
    mentor_id UUID NOT NULL,
    mentor_email TEXT NOT NULL,
    mentor_user_id UUID NOT NULL,
    amount_paid NUMERIC NOT NULL DEFAULT 99,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'completed',
    session_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    last_message_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_purchases_student ON mentor_session_purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_purchases_mentor ON mentor_session_purchases(mentor_user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_purchases_active ON mentor_session_purchases(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_mentor_purchases_student_email ON mentor_session_purchases(student_email);

-- =====================================================
-- FREE ACCESS TABLE
-- Stores users with free access to all mentors
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_free_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    granted_by TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_free_access_email ON mentor_free_access(email);
CREATE INDEX IF NOT EXISTS idx_free_access_user ON mentor_free_access(user_id);

-- =====================================================
-- Insert special user with free access
-- =====================================================
-- Note: This will be handled in backend when user logs in
-- INSERT INTO mentor_free_access (email, granted_by, reason, is_active)
-- VALUES ('rituchaubey1984@gmail.com', 'system', 'Prepixo founder - free access to all mentors', TRUE)
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Function to check if session is expired
-- =====================================================
CREATE OR REPLACE FUNCTION is_session_expired(expires_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to auto-deactivate expired sessions
-- =====================================================
CREATE OR REPLACE FUNCTION deactivate_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE mentor_session_purchases
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE mentor_session_purchases IS 'Stores all paid mentor sessions with 1-month access period';
COMMENT ON TABLE mentor_free_access IS 'Users with free lifetime access to all mentors';
COMMENT ON COLUMN mentor_session_purchases.expires_at IS 'Session expires 1 month after purchase';
COMMENT ON COLUMN mentor_session_purchases.is_active IS 'Auto-deactivated when expires_at passes';
