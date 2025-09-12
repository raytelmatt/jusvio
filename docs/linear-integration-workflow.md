# Linear Integration Workflow

This document outlines the systematic approach for tracking all changes to the Jusivo app in Linear, ensuring proper documentation, accountability, and project visibility.

## 🎯 Core Rule

**Every change to the Jusivo app must be documented in Linear before implementation begins.**

## 📋 Workflow Overview

### 1. Pre-Development Phase

#### 1.1 Issue Creation
- **When**: Before any development work begins
- **Where**: Linear (primary) or GitHub (secondary)
- **Who**: Developer or Product Manager

#### 1.2 Issue Requirements
Every Linear issue must include:
- ✅ Clear title with appropriate prefix
- ✅ Detailed description of the change
- ✅ Acceptance criteria
- ✅ Technical requirements
- ✅ Testing requirements
- ✅ Priority level
- ✅ Assignee
- ✅ Labels for categorization

#### 1.3 Issue Types and Prefixes
- `[FEATURE]` - New features or enhancements
- `[BUG]` - Bug fixes
- `[TECH-DEBT]` - Technical debt and refactoring
- `[CONFIG]` - Configuration changes
- `[INFRA]` - Infrastructure updates
- `[SECURITY]` - Security-related changes
- `[PERF]` - Performance improvements
- `[UI/UX]` - User interface/experience changes
- `[DB]` - Database migrations
- `[INTEGRATION]` - Third-party integrations

### 2. During Development Phase

#### 2.1 Progress Tracking
- Update issue status as work progresses
- Add comments for significant decisions
- Link to pull requests and commits
- Update time estimates if needed

#### 2.2 Branch Naming Convention
Use Linear issue identifier in branch names:
```bash
git checkout -b iahmatthew/RAY-123-descriptive-branch-name
```

#### 2.3 Commit Message Format
Include Linear issue reference in commit messages:
```bash
git commit -m "RAY-123: Add user authentication feature

- Implement login form
- Add password validation
- Update user model

Closes RAY-123"
```

### 3. Post-Development Phase

#### 3.1 Completion Checklist
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Issue status updated to "Done"
- [ ] Issue closed with summary

#### 3.2 Testing Requirements
Every change must include appropriate testing:
- **Unit Tests**: For business logic and utilities
- **Integration Tests**: For API endpoints and services
- **E2E Tests**: For user workflows
- **Manual Testing**: For UI/UX changes

## 🔧 Implementation Tools

### GitHub Integration
- Linear automatically links to GitHub commits and PRs
- Use Linear issue IDs in commit messages
- Link PRs to Linear issues in PR descriptions

### Automation Scripts
Use the provided scripts for common tasks:
- `scripts/linear/create-issue.mjs` - Create Linear issues from templates
- `scripts/linear/update-status.mjs` - Update issue status
- `scripts/linear/sync-github.mjs` - Sync GitHub issues with Linear

### Templates
Use issue templates for consistency:
- Feature Request Template
- Bug Report Template
- Technical Debt Template

## 📊 Tracking and Metrics

### Key Metrics to Monitor
- Issues created vs. completed
- Average time to completion
- Bug fix vs. feature development ratio
- Technical debt reduction
- Testing coverage

### Reporting
- Weekly progress reports
- Monthly project health checks
- Quarterly retrospective reviews

## 🚨 Enforcement

### Code Review Process
- All PRs must reference a Linear issue
- No code changes without corresponding Linear issue
- Reviewers check for proper issue linking

### CI/CD Integration
- Automated checks for Linear issue references
- Status updates based on deployment stages
- Notification system for issue updates

## 📝 Examples

### Example 1: Feature Development
```
1. Create Linear issue: RAY-124: Add client search functionality
2. Define acceptance criteria and technical requirements
3. Create branch: iahmatthew/RAY-124-client-search
4. Develop feature with regular commits referencing RAY-124
5. Create PR linking to RAY-124
6. Complete testing and code review
7. Deploy and update Linear issue status
8. Close issue with deployment summary
```

### Example 2: Bug Fix
```
1. Create Linear issue: RAY-125: Fix login timeout issue
2. Set priority based on impact
3. Create branch: iahmatthew/RAY-125-fix-login-timeout
4. Implement fix with test coverage
5. Create PR with detailed description
6. Test fix in staging environment
7. Deploy to production
8. Update and close Linear issue
```

## 🔄 Continuous Improvement

### Regular Reviews
- Monthly workflow effectiveness review
- Quarterly process optimization
- Annual tool and integration evaluation

### Feedback Loop
- Developer feedback on workflow efficiency
- Manager feedback on project visibility
- Stakeholder feedback on communication

## 📚 Resources

### Documentation
- [Linear Documentation](https://linear.app/docs)
- [GitHub Integration Guide](https://linear.app/docs/integrations/github)
- [Issue Templates](./.github/ISSUE_TEMPLATE/)

### Tools
- Linear Web App
- Linear CLI
- GitHub Actions
- Custom automation scripts

### Support
- Team lead for workflow questions
- Linear support for technical issues
- GitHub support for integration issues

---

**Remember**: The goal is not to create bureaucracy, but to ensure that all changes are properly documented, tracked, and communicated to maintain project health and team coordination.
