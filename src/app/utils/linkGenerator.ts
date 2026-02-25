/**
 * Link generation utilities for Connecta
 * Generates shareable links for profiles, servers, calls, etc.
 */

const BASE_DOMAIN = 'connecta.link';

/**
 * Generate a random alphanumeric code
 * @param length - Length of the code to generate
 * @param includeHyphens - Whether to include hyphens for readability
 */
function generateCode(length: number, includeHyphens: boolean = false): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    // Add hyphen every 4 characters if enabled
    if (includeHyphens && (i + 1) % 4 === 0 && i < length - 1) {
      code += '-';
    }
  }
  
  return code;
}

/**
 * Generate a profile share link
 * @param userId - User ID to generate link for
 * @returns Full profile URL
 */
export function generateProfileLink(_userId: string): string {
  // Create a short code based on user ID
  // Note: In production, this should map to the actual userId in a database
  const shortCode = generateCode(8);
  return `https://${BASE_DOMAIN}/u/${shortCode}`;
}

/**
 * Generate a server invite link
 * @param serverId - Server ID
 * @param inviteCode - Optional custom invite code (8 chars)
 * @returns Full server invite URL
 */
export function generateServerInviteLink(_serverId: string, inviteCode?: string): string {
  const code = inviteCode || generateCode(8).toUpperCase();
  return `https://${BASE_DOMAIN}/s/${code}`;
}

/**
 * Generate a call invite link
 * @param callId - Call ID
 * @param isVideo - Whether it's a video call
 * @returns Full call invite URL
 */
export function generateCallInviteLink(_callId: string, isVideo: boolean = true): string {
  const prefix = isVideo ? 'v' : 'a'; // v for video, a for audio
  const code = generateCode(8, true); // 8 chars with hyphens: xxxx-xxxx
  return `https://${BASE_DOMAIN}/${prefix}/${code}`;
}

/**
 * Generate a friend invite link
 * @param userId - User ID sending the invite
 * @returns Full friend invite URL
 */
export function generateFriendInviteLink(_userId: string): string {
  const code = generateCode(10);
  return `https://${BASE_DOMAIN}/f/${code}`;
}

/**
 * Generate a group chat invite link
 * @param groupId - Group chat ID
 * @returns Full group invite URL
 */
export function generateGroupInviteLink(_groupId: string): string {
  const code = generateCode(12);
  return `https://${BASE_DOMAIN}/g/${code}`;
}

/**
 * Copy text to clipboard with fallback
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Parse a Connecta link and extract type and code
 * @param url - Full URL or just the path
 * @returns Object with link type and code, or null if invalid
 */
export function parseConnectaLink(url: string): { type: 'user' | 'server' | 'call' | 'friend' | 'group'; code: string } | null {
  try {
    // Remove protocol and domain if present
    const path = url.replace(`https://${BASE_DOMAIN}`, '').replace(/^\//, '');
    const parts = path.split('/');
    
    if (parts.length !== 2) return null;
    
    const [prefix, code] = parts;
    
    const typeMap: Record<string, 'user' | 'server' | 'call' | 'friend' | 'group'> = {
      'u': 'user',
      's': 'server',
      'v': 'call',
      'a': 'call',
      'f': 'friend',
      'g': 'group'
    };
    
    const type = typeMap[prefix];
    if (!type) return null;
    
    return { type, code };
  } catch (err) {
    return null;
  }
}
