'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Case, Note } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import { createNote, updateNote } from '@/actions/cases.actions';
import { getTimeAgo } from './utils';
import CopyableText from '@/components/common/copyable-text/CopyableText';

interface CaseNotesProps {
  caseData: Case;
  onRefresh: () => void;
  isViewOnly?: boolean;
}

export const CaseNotes = ({ caseData, onRefresh, isViewOnly = false }: CaseNotesProps) => {
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      await createNote({
        case_id: caseData.id,
        note: newNote,
      });
      toast.success('Note added successfully');
      setNewNote('');
      onRefresh();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateNote({
        id: noteId,
        note: editContent,
      });
      toast.success('Note updated successfully');
      setEditingNote(null);
      setEditContent('');
      onRefresh();
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast.error(error.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditContent(note.note);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const notes = [...(caseData.notes || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      {!isViewOnly && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Add Internal Note
          </label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter internal investigation notes..."
            className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-y"
            disabled={loading}
          />
          <button
            onClick={handleAddNote}
            disabled={loading || !newNote.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ICONS.Plus size={18} />
            {loading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          All Notes ({notes.length})
        </h3>

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <ICONS.FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Add your first investigation note above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
              >
                {editingNote === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-foreground resize-y"
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
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
                        <ICONS.User
                          size={16}
                          className="text-muted-foreground"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {note.author_user?.full_name || getAuthorName(note.author) || note.author}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          (<CopyableText
                            text={note.author}
                            textClassName="text-xs text-muted-foreground"
                            truncate
                          />)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(note.created_at)}
                        </span>
                        {!isViewOnly && (
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                            title="Edit note"
                          >
                            <ICONS.Edit
                              size={14}
                              className="text-muted-foreground"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {note.note}
                    </p>
                    {note.updated_at !== note.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Edited {getTimeAgo(note.updated_at)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
