# Sync Script Changelog

## Version 2.0 - True Bidirectional Sync

### 🎉 Major Features

#### 1. **Deletion Detection**
- Detects albums removed from local folders
- Detects songs removed from albums
- Detects versions removed from songs
- Safe by default: warns but doesn't delete without `--force`

#### 2. **Rename Detection**
- Detects when track numbers change (e.g., `01-song.wav` → `02-song.wav`)
- Detects when song titles change (e.g., `01-opening.wav` → `01-the-opening.wav`)
- Automatically updates database to match local changes

#### 3. **Interactive Diff Display**
Shows exactly what will change before applying:
```
📊 Changes detected:

✓ 2 new songs to add
✗ 1 album to delete (removed locally)
⚠ 3 songs renamed

Continue? (y/n)
```

#### 4. **Safe vs Force Modes**

**Safe Mode (default):**
```bash
pnpm sync-content ~/content
```
- ✅ Adds new content
- ✅ Updates renamed content
- ⚠️ Warns about deletions but doesn't apply them

**Force Mode:**
```bash
pnpm sync-content ~/content --force
```
- ✅ Adds new content
- ✅ Updates renamed content
- 🗑️ Deletes content removed locally

#### 5. **Comprehensive Change Tracking**
The script now tracks:
- Albums to add/delete
- Songs to add/delete/update
- Versions to add/delete
- All changes shown in organized diff

### 🔧 Technical Improvements

- **Database state fetching**: Fetches all albums, songs, and versions upfront
- **Change detection algorithm**: Compares local vs database state comprehensively
- **Interactive prompts**: Uses readline for user confirmation
- **Atomic operations**: Changes are applied in logical order (delete → update → add)
- **Better error handling**: Clear messages for each operation
- **Progress indicators**: Shows what's happening at each step

### 📝 Usage Examples

#### First-time sync (adding content):
```bash
pnpm sync-content ~/loki-content
```

#### Regular sync (checking for changes):
```bash
pnpm sync-content ~/loki-content
```

#### Sync with deletions (mirror local to database):
```bash
pnpm sync-content ~/loki-content --force
```

#### Using batch file (Windows):
```bash
sync.bat                    # Safe mode
sync.bat --force           # Force mode
```

### 🆚 Comparison with Old Behavior

| Feature | Old Sync | New Sync |
|---------|----------|----------|
| Add new content | ✅ | ✅ |
| Detect deletions | ❌ | ✅ |
| Detect renames | ❌ | ✅ |
| Show diff before changes | ❌ | ✅ |
| Interactive confirmation | ❌ | ✅ |
| Safe mode | ❌ | ✅ |
| Force mode | N/A | ✅ |
| Skip existing albums | ✅ | ✅ (but updates if changed) |

### 🚨 Breaking Changes

**None!** The script is fully backward compatible:
- Default behavior is safe (only adds/updates)
- Existing workflows continue to work
- Old command syntax still works: `pnpm sync-content <path>`

### 📚 Documentation Updates

- Updated `SYNC_GUIDE.md` with comprehensive examples
- Added sync mode documentation
- Added example outputs for all scenarios
- Updated `sync.bat` and `sync.bat.example` with `--force` support

### 🎯 Use Cases

1. **Initial content upload**: Use safe mode
2. **Adding new songs**: Use safe mode
3. **Renaming songs**: Use safe mode (auto-detects and updates)
4. **Removing old content**: Use force mode
5. **Complete content reorganization**: Use force mode
6. **Regular maintenance**: Use safe mode, check diff, use force if needed

### 💡 Tips

- Always run without `--force` first to see what will change
- Review the diff carefully before confirming
- Use safe mode for regular updates
- Use force mode only when you want to mirror local content exactly
- The script is idempotent - safe to run multiple times

### 🔮 Future Enhancements

Potential future additions:
- Dry-run mode (`--dry-run`)
- Selective sync (specific albums only)
- Backup before destructive operations
- Conflict resolution for manual database edits
- Sync statistics and reporting
