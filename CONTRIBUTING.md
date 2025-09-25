# Contributing to WashikaDAO

We welcome contributions to WashikaDAO! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Provide detailed information about the issue
- Include steps to reproduce the problem
- Specify your environment (OS, browser, etc.)

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its benefits
- Explain how it aligns with WashikaDAO's mission

### Code Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/0xMgwan/WashikaDAO.git
   cd WashikaDAO
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   # Test smart contracts
   clarinet test
   
   # Test frontend
   cd frontend
   npm test
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Development Guidelines

### Smart Contracts (Clarity)
- Follow Clarity best practices
- Use descriptive function and variable names
- Include comprehensive error handling
- Write unit tests for all functions
- Document complex logic with comments

### Frontend (React/TypeScript)
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write accessible UI components

### Code Style
- Use consistent indentation (2 spaces)
- Follow naming conventions:
  - `kebab-case` for Clarity functions
  - `camelCase` for JavaScript/TypeScript
  - `PascalCase` for React components
- Keep functions small and focused
- Use meaningful commit messages

### Testing
- Write unit tests for all new features
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Use descriptive test names

## 🔒 Security

### Reporting Security Issues
- **DO NOT** open public issues for security vulnerabilities
- Email security concerns to: security@washikadao.org
- Include detailed information about the vulnerability
- Allow time for the team to address the issue

### Security Best Practices
- Never commit private keys or secrets
- Use environment variables for sensitive data
- Follow smart contract security guidelines
- Implement proper access controls

## 📋 Pull Request Process

1. **Pre-submission Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass locally
   - [ ] Documentation is updated
   - [ ] No merge conflicts
   - [ ] Commit messages are clear

2. **PR Description**
   - Describe what the PR does
   - Link to related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

3. **Review Process**
   - PRs require at least one review
   - Address reviewer feedback
   - Maintain a respectful tone
   - Be open to suggestions

## 🌟 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Community Discord announcements

## 📞 Getting Help

- Join our [Discord community](https://discord.gg/washikadao)
- Check existing issues and discussions
- Read the documentation thoroughly
- Ask questions in the appropriate channels

## 🎯 Project Goals

Remember that WashikaDAO is built for marginalized communities. Consider:
- Accessibility and inclusivity
- User experience for non-technical users
- Gas efficiency and cost optimization
- Clear documentation and tutorials

Thank you for contributing to WashikaDAO! 🚀
