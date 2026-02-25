-- Create friendships table for user relationships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('friend', 'pending_incoming', 'pending_outgoing', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate friendships
  UNIQUE(user_id, friend_id),
  
  -- Prevent self-friendship
  CHECK (user_id != friend_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own friendships and friendships where they are the friend
CREATE POLICY "Users can view their friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Policy: Users can insert friendships where they are the user
CREATE POLICY "Users can create friendships"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own friendships
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Users can delete their own friendships
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create a view for easier friend queries with user metadata
CREATE OR REPLACE VIEW public.friends_view AS
SELECT 
  f.id,
  f.user_id,
  f.friend_id,
  f.status,
  f.created_at,
  u.email as friend_email,
  u.raw_user_meta_data->>'username' as friend_username,
  u.raw_user_meta_data->>'avatar' as friend_avatar,
  u.raw_user_meta_data->>'isVerified' as friend_is_verified
FROM public.friendships f
JOIN auth.users u ON f.friend_id = u.id;

-- Grant access to the view
GRANT SELECT ON public.friends_view TO authenticated;

-- Function to add friend request
CREATE OR REPLACE FUNCTION public.add_friend_request(friend_username TEXT)
RETURNS JSON AS $$
DECLARE
  friend_user_id UUID;
  result JSON;
BEGIN
  -- Find user by username
  SELECT id INTO friend_user_id
  FROM auth.users
  WHERE raw_user_meta_data->>'username' = friend_username;
  
  IF friend_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF friend_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot add yourself as friend');
  END IF;
  
  -- Check if friendship already exists
  IF EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (user_id = auth.uid() AND friend_id = friend_user_id)
       OR (user_id = friend_user_id AND friend_id = auth.uid())
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Friendship already exists');
  END IF;
  
  -- Create outgoing request for sender
  INSERT INTO public.friendships (user_id, friend_id, status)
  VALUES (auth.uid(), friend_user_id, 'pending_outgoing');
  
  -- Create incoming request for receiver
  INSERT INTO public.friendships (user_id, friend_id, status)
  VALUES (friend_user_id, auth.uid(), 'pending_incoming');
  
  RETURN json_build_object('success', true, 'message', 'Friend request sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION public.accept_friend_request(friend_user_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Update both sides to 'friend' status
  UPDATE public.friendships
  SET status = 'friend', updated_at = NOW()
  WHERE (user_id = auth.uid() AND friend_id = friend_user_id)
     OR (user_id = friend_user_id AND friend_id = auth.uid());
  
  RETURN json_build_object('success', true, 'message', 'Friend request accepted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove friend
CREATE OR REPLACE FUNCTION public.remove_friend(friend_user_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Delete both sides of the friendship
  DELETE FROM public.friendships
  WHERE (user_id = auth.uid() AND friend_id = friend_user_id)
     OR (user_id = friend_user_id AND friend_id = auth.uid());
  
  RETURN json_build_object('success', true, 'message', 'Friend removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block user
CREATE OR REPLACE FUNCTION public.block_user(blocked_user_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Remove existing friendship if any
  DELETE FROM public.friendships
  WHERE (user_id = auth.uid() AND friend_id = blocked_user_id)
     OR (user_id = blocked_user_id AND friend_id = auth.uid());
  
  -- Create blocked relationship
  INSERT INTO public.friendships (user_id, friend_id, status)
  VALUES (auth.uid(), blocked_user_id, 'blocked');
  
  RETURN json_build_object('success', true, 'message', 'User blocked');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
