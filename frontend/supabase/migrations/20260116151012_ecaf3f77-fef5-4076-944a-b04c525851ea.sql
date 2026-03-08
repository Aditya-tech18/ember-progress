-- Fix otp_store and password_reset_otps RLS (service role access only)
CREATE POLICY "Service role can manage otp_store" ON otp_store FOR ALL USING (true);
CREATE POLICY "Service role can manage password_reset_otps" ON password_reset_otps FOR ALL USING (true);

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_contest_ranks(p_contest_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE contest_participants
  SET rank = sub.new_rank
  FROM (
    SELECT id, RANK() OVER (ORDER BY total_marks DESC, submitted_at ASC) AS new_rank
    FROM contest_participants
    WHERE contest_id = p_contest_id
    AND submitted_at IS NOT NULL
  ) AS sub
  WHERE contest_participants.id = sub.id
  AND contest_participants.contest_id = p_contest_id;
END;
$$;