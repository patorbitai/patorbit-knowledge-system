'use client';

import { type Folder } from '@patorbit/types';
import { useCallback, useEffect, useState } from 'react';

import { useWorkspaceStore } from '@/lib/stores/use-workspace-store';

// ── Folder Tree ────────────────────────────────────────────────────────────────

export function FolderTree() {
  const {
    folders,
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    currentFolderId,
    setCurrentFolder,
    loadingFolders,
    fetchResumes,
    fetchCoverLetters,
  } = useWorkspaceStore();

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleCreate = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  }, [newFolderName, createFolder]);

  const handleRename = useCallback(
    async (id: string) => {
      if (!editingName.trim()) return;
      await renameFolder(id, editingName.trim());
      setEditingId(null);
    },
    [editingName, renameFolder],
  );

  const handleSelect = useCallback(
    (folderId: string | null) => {
      setCurrentFolder(folderId);
      fetchResumes();
      fetchCoverLetters();
    },
    [setCurrentFolder, fetchResumes, fetchCoverLetters],
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete folder "${name}"? Items in this folder won't be deleted.`)) return;
      await deleteFolder(id);
      fetchResumes();
      fetchCoverLetters();
    },
    [deleteFolder, fetchResumes, fetchCoverLetters],
  );

  // Collect root folders and children
  const rootFolders = folders.filter((f) => !f.parentId);
  const getChildren = (parentId: string) => folders.filter((f) => f.parentId === parentId);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          onClick={() => handleSelect(null)}
          className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground ${
            !currentFolderId ? 'text-foreground' : ''
          }`}
        >
          📁 Folders
        </button>
        <button
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="text-muted-foreground hover:text-foreground text-sm"
          title="New folder"
        >
          +
        </button>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="px-2 pb-2">
          <div className="flex gap-1">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name…"
              className="flex-1 border rounded px-2 py-1 text-xs bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }
              }}
            />
            <button
              onClick={handleCreate}
              className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingFolders && (
        <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">Loading…</div>
      )}

      {/* "All items" root option */}
      <button
        onClick={() => handleSelect(null)}
        className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors ${
          !currentFolderId ? 'bg-accent font-medium' : ''
        }`}
      >
        📄 All items
      </button>

      {/* Root folders */}
      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          children={getChildren(folder.id)}
          allFolders={folders}
          depth={0}
          isSelected={currentFolderId === folder.id}
          isEditing={editingId === folder.id}
          editingName={editingName}
          onSelect={handleSelect}
          onStartEdit={(id, name) => {
            setEditingId(id);
            setEditingName(name);
          }}
          onEditingNameChange={setEditingName}
          onSaveEdit={handleRename}
          onCancelEdit={() => setEditingId(null)}
          onDelete={handleDelete}
        />
      ))}

      {!loadingFolders && folders.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground italic">No folders yet</p>
      )}
    </div>
  );
}

// ── Folder Item ────────────────────────────────────────────────────────────────

interface FolderItemProps {
  folder: Folder;
  children: Folder[];
  allFolders: Folder[];
  depth: number;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: (id: string | null) => void;
  onStartEdit: (id: string, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string, name: string) => void;
}

function FolderItem({
  folder,
  children,
  allFolders,
  depth,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onStartEdit,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: FolderItemProps) {
  const [expanded, setExpanded] = useState(true);

  // Load grandchildren
  const grandChildren = children.flatMap((child) =>
    allFolders.filter((f) => f.parentId === child.id),
  );

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors group cursor-pointer ${
          isSelected ? 'bg-accent font-medium' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-xs text-muted-foreground w-4"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {children.length === 0 && <span className="w-4" />}

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="flex-1 border rounded px-1 py-0.5 text-xs bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(folder.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button onClick={() => onSaveEdit(folder.id)} className="text-xs text-primary">
              ✓
            </button>
            <button onClick={onCancelEdit} className="text-xs text-muted-foreground">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => onSelect(folder.id)} className="flex-1 text-left truncate">
            📁 {folder.name}
          </button>
        )}

        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(folder.id, folder.name);
              }}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
              title="Rename"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder.id, folder.name);
              }}
              className="text-xs text-muted-foreground hover:text-red-500 px-1"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded &&
        children.map((child) => (
          <FolderItem
            key={child.id}
            folder={child}
            children={grandChildren.filter((gc) => gc.parentId === child.id)}
            allFolders={allFolders}
            depth={depth + 1}
            isSelected={false}
            isEditing={false}
            editingName=""
            onSelect={onSelect}
            onStartEdit={onStartEdit}
            onEditingNameChange={onEditingNameChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}
