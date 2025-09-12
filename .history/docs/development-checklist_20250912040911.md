# Development Checklist

This checklist ensures that all changes to the Jusivo app are properly tracked and documented in Linear.

## 📋 Pre-Development Checklist

### 1. Issue Creation
- [ ] **Linear Issue Created**: Issue exists in Linear with proper title and description
- [ ] **Issue Type**: Correct prefix used ([FEATURE], [BUG], [TECH-DEBT], etc.)
- [ ] **Acceptance Criteria**: Clear, testable criteria defined
- [ ] **Technical Requirements**: Technical constraints and requirements documented
- [ ] **Testing Requirements**: Testing strategy defined
- [ ] **Priority Set**: Appropriate priority level assigned
- [ ] **Assignee**: Issue assigned to developer
- [ ] **Labels**: Relevant labels applied

### 2. Planning
- [ ] **Dependencies Identified**: Any blocking issues or dependencies noted
- [ ] **Time Estimate**: Realistic time estimate provided
- [ ] **Risk Assessment**: Potential risks identified and mitigated

## 🔧 During Development Checklist

### 1. Branch and Commit Management
- [ ] **Branch Naming**: Branch follows convention `username/RAY-XXX-descriptive-name`
- [ ] **Commit Messages**: Commits reference Linear issue ID
- [ ] **Regular Commits**: Frequent, meaningful commits made
- [ ] **Issue Updates**: Linear issue updated with progress

### 2. Code Quality
- [ ] **Code Review**: Code reviewed by team member
- [ ] **Linting**: Code passes all linting checks
- [ ] **Type Safety**: TypeScript types properly defined
- [ ] **Error Handling**: Appropriate error handling implemented

### 3. Testing
- [ ] **Unit Tests**: Unit tests written and passing
- [ ] **Integration Tests**: Integration tests written and passing
- [ ] **E2E Tests**: End-to-end tests updated if needed
- [ ] **Manual Testing**: Manual testing completed

## 🚀 Post-Development Checklist

### 1. Pull Request
- [ ] **PR Description**: Clear description with Linear issue reference
- [ ] **Testing Notes**: Testing approach and results documented
- [ ] **Deployment Notes**: Any special deployment considerations noted
- [ ] **Breaking Changes**: Any breaking changes clearly documented

### 2. Linear Issue Updates
- [ ] **Status Updated**: Issue status updated to reflect current state
- [ ] **Comments Added**: Significant decisions and progress documented
- [ ] **Links Added**: PR and commit links added to issue
- [ ] **Time Tracking**: Actual time spent updated

### 3. Deployment
- [ ] **Staging Deployed**: Changes deployed to staging environment
- [ ] **Staging Tested**: Changes tested in staging environment
- [ ] **Production Deployed**: Changes deployed to production
- [ ] **Production Verified**: Changes verified in production

### 4. Completion
- [ ] **Issue Closed**: Linear issue marked as Done
- [ ] **Summary Added**: Completion summary added to issue
- [ ] **Documentation Updated**: Any relevant documentation updated
- [ ] **Team Notified**: Team notified of completion

## 🔍 Quality Gates

### Code Review Requirements
- [ ] **Linear Issue Reference**: PR must reference Linear issue
- [ ] **Testing Coverage**: Adequate test coverage maintained
- [ ] **Performance Impact**: No negative performance impact
- [ ] **Security Review**: Security implications considered

### Deployment Requirements
- [ ] **All Tests Passing**: CI/CD pipeline passes
- [ ] **No Breaking Changes**: No unexpected breaking changes
- [ ] **Rollback Plan**: Rollback plan documented if needed
- [ ] **Monitoring**: Appropriate monitoring in place

## 📊 Metrics to Track

### Development Metrics
- [ ] **Time to Complete**: Track actual vs. estimated time
- [ ] **Bug Rate**: Track bugs introduced per feature
- [ ] **Test Coverage**: Maintain test coverage above threshold
- [ ] **Code Quality**: Track code quality metrics

### Process Metrics
- [ ] **Issue Creation Rate**: Track issue creation frequency
- [ ] **Completion Rate**: Track issue completion rate
- [ ] **Review Time**: Track code review time
- [ ] **Deployment Frequency**: Track deployment frequency

## 🚨 Red Flags

### Stop Development If:
- [ ] **No Linear Issue**: Development started without Linear issue
- [ ] **Unclear Requirements**: Acceptance criteria not well defined
- [ ] **High Risk**: High-risk changes without proper planning
- [ ] **Dependencies**: Blocking dependencies not resolved

### Escalate If:
- [ ] **Scope Creep**: Requirements expanding beyond original scope
- [ ] **Technical Debt**: Significant technical debt being introduced
- [ ] **Performance Issues**: Performance degradation detected
- [ ] **Security Concerns**: Security implications not addressed

## 📚 Resources

### Tools
- **Linear**: [linear.app](https://linear.app)
- **GitHub**: [github.com](https://github.com)
- **Linear CLI**: `npm install -g @linear/cli`
- **GitHub CLI**: `npm install -g @github/cli`

### Scripts
- **Create Issue**: `node scripts/linear/create-issue.mjs`
- **Update Status**: `node scripts/linear/update-status.mjs`
- **Sync GitHub**: `node scripts/linear/sync-github.mjs`

### Templates
- **Feature Request**: `.github/ISSUE_TEMPLATE/feature-request.md`
- **Bug Report**: `.github/ISSUE_TEMPLATE/bug-report.md`
- **Technical Debt**: `.github/ISSUE_TEMPLATE/technical-debt.md`

---

**Remember**: This checklist is a tool to ensure quality and proper tracking. Adapt it to your specific needs while maintaining the core principle of documenting all changes in Linear.
