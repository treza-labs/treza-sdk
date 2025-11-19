# TREZA Scripts

Automation scripts for managing the TREZA project.

## Issue Management

### create-todo-issues.sh

Automatically creates GitHub issues for all TODOs, placeholders, and technical debt in the codebase.

**Prerequisites:**
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login
```

**Usage:**
```bash
# Run from project root
./scripts/create-todo-issues.sh
```

**What it does:**
- Scans codebase for TODOs, placeholders, and simulations
- Creates detailed GitHub issues with:
  - Full context and code snippets
  - Proper labels (technical-debt, priority, etc.)
  - Linked to `v1.0-production-ready` milestone
  - Action items and acceptance criteria
- Creates issues in correct repositories:
  - treza-sdk issues
  - treza-contracts issues
  - treza-app issues

**Created Issues:**
1. **ZKPassport Proof Conversion** - Critical production blocker
2. **Verification Key Generation** - Critical production blocker
3. **ZKPassport Integration Spec** - Blocks issues #1 and #2
4. **Receipt Verification** - Medium priority feature
5. **zkVerify Contract Address** - Configuration needed
6. **Verification Key Hash** - Configuration needed
7. **Production Readiness Meta Issue** - Tracks overall progress

## Automated Tracking

### GitHub Actions Workflow

Location: `.github/workflows/todo-to-issue.yml`

**Triggers:**
- On push to `main` or `develop` branches
- On pull requests
- Manual workflow dispatch

**Features:**
- Automatically creates issues from new TODOs
- Closes issues when TODOs are removed
- Reports TODO summary in workflow output
- Checks for critical placeholders
- Comments on PRs with warnings

**TODO Format for Auto-Detection:**
```typescript
// TODO: Description of what needs to be done
// Priority: high
// Labels: technical-debt, zkverify-integration
```

The GitHub Action will automatically create an issue for any TODO without an issue reference.

**Add issue reference to prevent duplicate issues:**
```typescript
// TODO(issue:#123): Already tracked in issue 123
```

## Issue Templates

Location: `.github/ISSUE_TEMPLATE/technical-debt.md`

**Usage:**
1. Go to GitHub Issues
2. Click "New Issue"
3. Select "Technical Debt" template
4. Fill in the details

**Sections:**
- Problem description
- File location and line numbers
- Current vs desired state
- Impact assessment
- Action items
- Priority and dependencies
- Acceptance criteria

## Production Readiness Tracking

Location: `PRODUCTION_READINESS.md`

Comprehensive checklist tracking:
- Implementation gaps
- Configuration needs
- Testing status
- Security checklist
- Deployment readiness
- Timeline estimates

**Update regularly** as issues are resolved!

## Quick Reference

### Create All Issues Now
```bash
./scripts/create-todo-issues.sh
```

### Check What Would Be Created (Dry Run)
```bash
# List all TODOs without issue references
git grep -n "TODO" -- "*.ts" "*.sol" | grep -v "TODO(issue:"
```

### View Created Issues
```bash
# SDK issues
gh issue list --repo treza-labs/treza-sdk --label "technical-debt"

# Contracts issues
gh issue list --repo treza-labs/treza-contracts --label "technical-debt"
```

### Manual Issue Creation
```bash
gh issue create \
  --repo treza-labs/treza-sdk \
  --title "Issue title" \
  --body "Issue description" \
  --label "technical-debt,priority:high"
```

## Best Practices

### 1. Link TODOs to Issues
After creating issues, update your code:
```typescript
// TODO(issue:#123, priority:high): Implement feature X
```

### 2. Use Standard Prefixes
- `TODO` - Needs implementation
- `FIXME` - Known bug
- `HACK` - Temporary workaround
- `NOTE` - Important explanation
- `OPTIMIZE` - Performance improvement

### 3. Add Context
```typescript
// TODO(issue:#123): Implement real proof conversion
// Currently simulated - needs ZKPassport specification
// Blocked by: Waiting on ZKPassport team
```

### 4. Regular Reviews
- Weekly: Review `PRODUCTION_READINESS.md`
- Sprint planning: Review GitHub Issues with `technical-debt` label
- PR reviews: Check for new TODOs without issues

## Troubleshooting

### GitHub CLI Not Authenticated
```bash
gh auth login
# Follow prompts
```

### Permission Denied on Script
```bash
chmod +x scripts/create-todo-issues.sh
```

### Issues Already Exist
The script will warn: `⚠️ Issue may already exist`

This is normal if you've run it before. GitHub CLI will handle duplicates.

### GitHub Actions Not Running
1. Check workflow file exists: `.github/workflows/todo-to-issue.yml`
2. Ensure repository has Actions enabled
3. Check workflow permissions: Settings → Actions → General → Workflow permissions
4. Must have "Read and write permissions" enabled

## Maintenance

### Update Issue Script
Edit `scripts/create-todo-issues.sh` to add new issue templates.

### Update GitHub Action
Edit `.github/workflows/todo-to-issue.yml` to change automation behavior.

### Update Production Checklist
Edit `PRODUCTION_READINESS.md` as work progresses.

## Support

For questions or issues with these scripts:
1. Open an issue with label `tooling`
2. Tag the DevOps team
3. Check GitHub Actions logs for automation issues

