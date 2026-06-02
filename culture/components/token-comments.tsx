'use client'

import { useState, useEffect } from 'react'
import { tokenService } from '@/services/token/tokenService'
import { useAuth } from '@/hooks/useAuth'
import { useSolanaWallet } from '@/hooks/useSolanaWallet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThumbsUp, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Comment {
  id: string;
  coin_id: string;
  user_id: string;
  commented_text: string;
  parent_id: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  username: string | null;
  profile_image_url: string | null;
  wallet_address: string | null;
  is_liked: boolean | number;
}

interface TokenCommentsProps {
  coinId: string;
}

// Formats UTC timestamp into friendly local relative time matching the screenshot (e.g., '5m ago', '1h ago')
function formatCommentTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'just now';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'recently';
  }
}

export function TokenComments({ coinId }: TokenCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const { publicKey } = useSolanaWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set());
  const [newCommentText, setNewCommentText] = useState('');

  const fetchComments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await tokenService.getComments(coinId, user?.id);
      if (res.success && res.data) {
        const parsed = res.data.map((c: any) => ({
          ...c,
          likes_count: Number(c.likes_count || 0),
          is_liked: c.is_liked === true || c.is_liked === 1 || String(c.is_liked) === '1' || String(c.is_liked) === 'true'
        }));
        setComments(parsed);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Error fetching comments');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [coinId, user?.id]);

  const handlePostComment = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please connect your wallet & sign in to comment');
      return;
    }

    const trimmed = newCommentText.trim();
    if (!trimmed) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const res = await tokenService.createComment(coinId, {
        userId: user.id,
        text: trimmed
      });

      if (res.success && res.data) {
        setNewCommentText('');
        // Dynamic insert at top of comments list with current user's profile info
        const newComment: Comment = {
          ...res.data,
          username: user.username || null,
          profile_image_url: user.profile_image_url || null,
          wallet_address: publicKey ? publicKey.toBase58() : (user.wallet_address || null),
          is_liked: false
        };
        setComments((prev) => [newComment, ...prev]);
        toast.success('Comment posted successfully');
      } else {
        toast.error(res.error || 'Failed to post comment');
      }
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.error || error.message || 'Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (comment: Comment) => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to like comments');
      return;
    }

    const commentId = comment.id;
    if (likingCommentIds.has(commentId)) return; // Prevent double clicking spam

    setLikingCommentIds((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    const currentlyLiked = !!comment.is_liked;

    // Optimistic UI updates
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const currentCount = Number(c.likes_count || 0);
          return {
            ...c,
            is_liked: !currentlyLiked,
            likes_count: Math.max(0, currentCount + (currentlyLiked ? -1 : 1)),
          };
        }
        return c;
      })
    );

    try {
      const res = await tokenService.toggleLike(commentId, user.id);
      if (!res.success) {
        throw new Error('Toggle like failed');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert optimistic updates on error
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const currentCount = Number(c.likes_count || 0);
            return {
              ...c,
              is_liked: currentlyLiked,
              likes_count: Math.max(0, currentCount + (currentlyLiked ? 1 : -1)),
            };
          }
          return c;
        })
      );
      toast.error('Failed to update like status');
    } finally {
      setLikingCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  // Helper to extract first 4 characters of user identity (e.g., '0x7f')
  const getAvatarText = (comment: Comment) => {
    const addr = comment.wallet_address || comment.username || comment.user_id || '';
    return addr.length >= 4 ? addr.slice(0, 4) : addr;
  };

  // Format identity exactly as wallet address '0x7f3...9a2c'
  const formatIdentity = (comment: Comment) => {
    const addr = comment.wallet_address || comment.username || comment.user_id || '';
    if (addr.length > 10) {
      return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }
    return addr;
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4">
        
        {/* Comment Input Row exactly matching the static styling */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <Textarea
              placeholder="Write a comment..."
              value={newCommentText}
              disabled={submitting}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="min-h-[80px] resize-none bg-secondary/50 border-border/50 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
          
          <Button
            size="icon"
            onClick={handlePostComment}
            disabled={submitting || !newCommentText.trim()}
            className="h-10 w-10 shrink-0 self-end bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-border/30 bg-secondary/5">
            <p className="text-sm font-semibold text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Be the first to share your thoughts on this token!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {comments.map((c) => {
              return (
                <div key={c.id} className="py-4 first:pt-0 last:pb-0">
                  {/* User Profile Header Row matching static style */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Avatar Circle with bg-secondary and text-xs */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-white shrink-0">
                        {getAvatarText(c)}
                      </div>
                      
                      {/* Wallet Address / Username */}
                      <span className="font-semibold text-white font-mono hover:text-[#FFD100] transition-colors cursor-pointer">
                        {formatIdentity(c)}
                      </span>
                    </div>

                    {/* Time ago on the far right */}
                    <span className="text-xs text-muted-foreground">
                      {formatCommentTime(c.created_at)}
                    </span>
                  </div>

                  {/* Comment Text Body */}
                  <p className="mb-2 text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                    {c.commented_text}
                  </p>

                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(c)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95 duration-200",
                      c.is_liked && "text-emerald-500 hover:text-emerald-400 font-semibold"
                    )}
                  >
                    <ThumbsUp className={cn("h-3.5 w-3.5", c.is_liked && "fill-emerald-500/10")} />
                    <span>{c.likes_count}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
