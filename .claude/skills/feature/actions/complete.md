# Complete Action

1. Stage all changes and commit with a descriptive message
2. Switch to main and merge the feature branch (no push yet)
3. Delete the local feature branch
4. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Set Status back to "Not Started"
   - Clear Goals and Notes sections
   - Add the feature summary to the END of `context/history.md`
5. Commit the reset and history entry: `chore: reset current-feature.md after completing [feature]`
6. Push main to origin ONCE (single push with all changes)
7. If feature branch was previously pushed, delete it from origin
