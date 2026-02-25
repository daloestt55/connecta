import { supabase } from "./supabase";

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "idle" | "dnd" | "offline";
  statusText?: string;
  isVerified?: boolean;
  relationship?: "friend" | "pending_incoming" | "pending_outgoing" | "blocked";
}

/**
 * Fetch all friends for the current user
 */
export async function getFriends(): Promise<Friend[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("No authenticated user found");
      return [];
    }

    const { data, error } = await supabase
      .from('friends_view')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching friends:", error);
      return [];
    }

    // Transform to Friend interface
    return (data || []).map(row => ({
      id: row.friend_id,
      username: row.friend_username || 'Unknown User',
      avatar: row.friend_avatar,
      status: 'offline' as const, // Default to offline, should be updated with real-time presence
      statusText: '',
      isVerified: row.friend_is_verified === 'true',
      relationship: row.status as Friend['relationship']
    }));
  } catch (err) {
    console.error("Exception fetching friends:", err);
    return [];
  }
}

/**
 * Add a friend request by username
 */
export async function addFriendRequest(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_friend_request', {
      friend_username: username
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_friend_request', {
      friend_user_id: friendId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_friend', {
      friend_user_id: friendId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Block a user
 */
export async function blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('block_user', {
      blocked_user_id: userId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get online status for friends (placeholder for real-time implementation)
 */
export async function getOnlineStatus(friendIds: string[]): Promise<Record<string, "online" | "idle" | "dnd" | "offline">> {
  // TODO: Implement with Supabase Realtime presence
  // For now, return offline for all
  const statuses: Record<string, "online" | "idle" | "dnd" | "offline"> = {};
  friendIds.forEach(id => {
    statuses[id] = 'offline';
  });
  return statuses;
}
