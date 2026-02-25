import { supabase } from './supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  type: 'text' | 'image' | 'file' | 'voice';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface Conversation {
  friend_id: string;
  last_message?: Message;
  unread_count: number;
}

/**
 * Send a message to another user
 */
export async function sendMessage(
  receiverId: string,
  content: string,
  type: 'text' | 'image' | 'file' | 'voice' = 'text',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const messageData = {
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      type,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      read: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: data };
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get messages between current user and another user
 */
export async function getMessages(
  friendId: string,
  limit: number = 50
): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messages: data || [] };
  } catch (error: any) {
    console.error('Error getting messages:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to new messages (real-time)
 */
export function subscribeToMessages(
  friendId: string,
  callback: (message: Message) => void
) {
  const { data: { user } } = supabase.auth.getUser().then(({ data }) => data);
  
  if (!user) {
    console.error('Not authenticated');
    return;
  }

  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.user?.id}`,
      },
      (payload) => {
        const message = payload.new as Message;
        // Only call callback if message is from the friend we're chatting with
        if (message.sender_id === friendId) {
          callback(message);
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from messages
 */
export function unsubscribeFromMessages(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

/**
 * Get all conversations with last message and unread count
 */
export async function getConversations(): Promise<{
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get all friends
    const { data: friends } = await supabase
      .rpc('get_friends', { user_uuid: user.id });

    if (!friends) {
      return { success: true, conversations: [] };
    }

    // Get last message and unread count for each friend
    const conversations = await Promise.all(
      friends.map(async (friend: any) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', friend.id)
          .eq('receiver_id', user.id)
          .eq('read', false);

        return {
          friend_id: friend.id,
          last_message: lastMessage || undefined,
          unread_count: count || 0,
        };
      })
    );

    return { success: true, conversations };
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string = 'chat-files'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return { success: false, error: error.message };
  }
}
