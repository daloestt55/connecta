-- Create messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice')),
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(sender_id, receiver_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages table

-- Users can read messages sent to them or sent by them
CREATE POLICY "Users can read their own messages"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Users can insert messages they are sending
CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) messages sent to them
CREATE POLICY "Users can update messages sent to them"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Users can delete messages they sent
CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files

-- Users can upload files
CREATE POLICY "Users can upload chat files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'chat-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view all chat files (public bucket)
CREATE POLICY "Anyone can view chat files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-files');

-- Users can delete their own files
CREATE POLICY "Users can delete own chat files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'chat-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_count(user_uuid UUID)
RETURNS TABLE (sender_id UUID, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.sender_id,
        COUNT(*) as unread_count
    FROM public.messages m
    WHERE m.receiver_id = user_uuid
        AND m.read = false
    GROUP BY m.sender_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_unread_count TO authenticated;

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
