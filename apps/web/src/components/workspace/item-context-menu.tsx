'use client';

import { useCallback, useRef, useState } from 'react';

import { useWorkspaceStore } from '@/lib/stores/use-workspace-store';

// ── Types ─────────────────────────────────────────────────────────────────────

type ItemType = 'resume' | 'cover-letter';

interface ItemContextMenuProps {
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  folderId?: string | null;
  isFavorite?: boolean;
  onClose: () => void;
}

// ── Context Menu ───────────────────────────────────────────────────────────────

export function ItemContextMenu({
  itemId,
  itemTitle,
  itemType,
  folderId,
  isFavorite,
  onClose,
}: ItemContextMenuProps) {
  const [showRename, setShowRename] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [newName, setNewName] = useState(itemTitle);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    renameResume,
    renameCoverLetter,
    toggleFavoriteResume,
    archiveResume,
    archiveCoverLetter,
    deleteResume,
    deleteCoverLetter,
    moveResumeToFolder,
    moveCoverLetterToFolder,
    duplicateResume,
    duplicateCoverLetter,
    folders,
  } = useWorkspaceStore();

  const handleRename = useCallback(async () => {
    if (!newName.trim()) return;
    if (itemType === 'resume') {
      await renameResume(itemId, newName.trim());
    } else {
      await renameCoverLetter(itemId, newName.trim());
    }
    setShowRename(false);
    onClose();
  }, [itemId, itemType, newName, renameResume, renameCoverLetter, onClose]);

  const handleToggleFavorite = useCallback(async () => {
    if (itemType === 'resume') {
      await toggleFavoriteResume(itemId, !isFavorite);
    }
    onClose();
  }, [itemId, itemType, isFavorite, toggleFavoriteResume, onClose]);

  const handleDuplicate = useCallback(async () => {
    if (itemType === 'resume') {
      await duplicateResume(itemId);
    } else {
      await duplicateCoverLetter(itemId);
    }
    onClose();
  }, [itemId, itemType, duplicateResume, duplicateCoverLetter, onClose]);

  const handleArchive = useCallback(async () => {
    if (itemType === 'resume') {
      await archiveResume(itemId);
    } else {
      await archiveCoverLetter(itemId);
    }
    onClose();
  }, [itemId, itemType, archiveResume, archiveCoverLetter, onClose]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${itemTitle}"? This cannot be undone.`)) return;
    if (itemType === 'resume') {
      await deleteResume(itemId);
    } else {
      await deleteCoverLetter(itemId);
    }
    onClose();
  }, [itemId, itemTitle, itemType, deleteResume, deleteCoverLetter, onClose]);

  const handleMoveToFolder = useCallback(
    async (targetFolderId: string | null) => {
      if (itemType === 'resume') {
        await moveResumeToFolder(itemId, targetFolderId);
      } else {
        await moveCoverLetterToFolder(itemId, targetFolderId);
      }
      setShowMove(false);
      onClose();
    },
    [itemId, itemType, moveResumeToFolder, moveCoverLetterToFolder, onClose],
  );

  // Clicking outside closes the menu
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (showRename) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        onClick={handleBackdropClick}
      >
        <div className="bg-card border rounded-lg p-4 w-80 shadow-lg" ref={menuRef}>
          <h3 className="font-medium text-sm mb-2">Rename</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-background"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setShowRename(false);
                onClose();
              }
            }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowRename(false);
                onClose();
              }}
              className="px-3 py-1.5 text-xs border rounded hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showMove) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        onClick={handleBackdropClick}
      >
        <div className="bg-card border rounded-lg p-4 w-80 shadow-lg">
          <h3 className="font-medium text-sm mb-2">Move to folder</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button
              onClick={() => handleMoveToFolder(null)}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${!folderId ? 'bg-accent font-medium' : ''}`}
            >
              No folder
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => handleMoveToFolder(f.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${folderId === f.id ? 'bg-accent font-medium' : ''}`}
              >
                📁 {f.name}
              </button>
            ))}
            {folders.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2">No folders yet</p>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => {
                setShowMove(false);
                onClose();
              }}
              className="px-3 py-1.5 text-xs border rounded hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" onClick={handleBackdropClick}>
      <div
        ref={menuRef}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-48 bg-card border rounded-lg shadow-lg py-1"
      >
        <button
          onClick={() => setShowRename(true)}
          className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
        >
          ✏️ Rename
        </button>
        {itemType === 'resume' && (
          <button
            onClick={handleToggleFavorite}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
          >
            {isFavorite ? '⭐ Unfavorite' : '☆ Favorite'}
          </button>
        )}
        <button
          onClick={handleDuplicate}
          className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
        >
          📋 Duplicate
        </button>
        <button
          onClick={() => setShowMove(true)}
          className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
        >
          📁 Move to folder
        </button>
        <button
          onClick={handleArchive}
          className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
        >
          🗄️ Archive
        </button>
        <hr className="my-1" />
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
