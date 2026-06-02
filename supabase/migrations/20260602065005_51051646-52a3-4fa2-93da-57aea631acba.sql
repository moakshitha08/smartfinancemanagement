
-- 1) Restrict SECURITY DEFINER trigger function from being callable via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) Realtime authorization: require auth + scope channel topics to the owning user
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_own_finance_topic" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_own_finance_topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'finance-rt-' || auth.uid()::text || '-%'
);

DROP POLICY IF EXISTS "authenticated_can_join_own_finance_topic" ON realtime.messages;
CREATE POLICY "authenticated_can_join_own_finance_topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'finance-rt-' || auth.uid()::text || '-%'
);
