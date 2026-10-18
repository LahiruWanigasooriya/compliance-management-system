'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Case, Comment } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import { getComments, createComment, updateComment } from '@/actions/cases.actions';
import { getTimeAgo } from './utils';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

interface CaseCommentsProps {
  caseData: Case;
  onRefresh: () => void;
  isViewOnly?: boolean;
}

export const CaseComments = ({ caseData, onRefresh }: CaseCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const getAuthorName = (authorId: string): string | null => {
    if (caseData.assigned_user?.id === authorId) {
      return caseData.assigned_user.full_name;
    }
    const spectator = caseData.spectators?.find(
      (s) => s.user_id === authorId || s.spectator?.id === authorId,
    );
    if (spectator?.spectator?.full_name) {
      return spectator.spectator.full_name;
    }
    return null;
  };

  useEffect(() => {
    loadComments();
  }, [caseData.id]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await getComments(caseData.id);
      setComments(data);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast.error(error.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      await createComment({
        case_id: caseData.id,
        comment: newComment,
      });
      toast.success('Comment added successfully');
      setNewComment('');
      await loadComments();
      onRefresh();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setLoading(true);
      await createComment({
        case_id: caseData.id,
        comment: replyContent,
        parent_id: parentId,
      });
      toast.success('Reply added successfully');
      setReplyTo(null);
      setReplyContent('');
      await loadComments();
      onRefresh();
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateComment(commentId, { comment: editContent });
      toast.success('Comment updated successfully');
      setEditingComment(null);
      setEditContent('');
      await loadComments();
      onRefresh();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error(error.message || 'Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.comment);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const startReply = (commentId: string) => {
    setReplyTo(commentId);
    setReplyContent('');
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplyContent('');
  };

  // Organize comments into parent-child structure
  const topLevelComments = comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const getReplies = (parentId: string) =>
    comments
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div
      key={comment.id}
      className={`${
        isReply
          ? 'ml-8 mt-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600'
          : 'p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700'
      }`}
    >
      {editingComment === comment.id ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-foreground resize-y"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateComment(comment.id)}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1A5276] dark:bg-blue-600 text-white rounded text-sm hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ICONS.CheckCircle size={14} />
              Save
            </button>
            <button
              onClick={cancelEditing}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-panel-border text-foreground rounded text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ICONS.X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <ICONS.User size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {comment.author_user?.full_name || getAuthorName(comment.author) || comment.author}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                (<CopyableText
                  text={comment.author}
                  textClassName="text-xs text-muted-foreground"
                  truncate
                />)
              </span>
              {isReply && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  Reply
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(comment.created_at)}
              </span>
              <button
                onClick={() => startEditing(comment)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                title="Edit comment"
              >
                <ICONS.Edit size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
            {comment.comment}
          </p>
          {comment.updated_at !== comment.created_at && (
            <p className="text-xs text-muted-foreground mb-2">
              Edited {getTimeAgo(comment.updated_at)}
            </p>
          )}
          {!isReply && (
            <button
              onClick={() => startReply(comment.id)}
              className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
            >
              <ICONS.MessageSquare size={12} />
              Reply
            </button>
          )}
        </>
      )}

      {/* Reply Form */}
      {replyTo === comment.id && !isReply && (
        <div className="mt-3 ml-8 space-y-2 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full min-h-[60px] p-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-y text-sm"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReply(comment.id)}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1A5276] dark:bg-blue-600 text-white rounded text-sm hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ICONS.Send size={14} />
              {loading ? 'Sending...' : 'Reply'}
            </button>
            <button
              onClick={cancelReply}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-panel-border text-foreground rounded text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render Replies */}
      {!isReply && (
        <div className="space-y-3 mt-3">
          {getReplies(comment.id).map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loadingComments) {
    return (
      <div className="relative py-8 min-h-[120px]">
        <LoadingOverlay loadingText="Loading comments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Add Collaborative Comment
        </label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share insights, ask questions, or collaborate with team members..."
          className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-y"
          disabled={loading}
        />
        <button
          onClick={handleAddComment}
          disabled={loading || !newComment.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ICONS.MessageSquare size={18} />
          {loading ? 'Adding...' : 'Add Comment'}
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          All Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <ICONS.MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Start the conversation by adding a comment above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};
