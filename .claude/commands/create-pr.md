Create a GitHub Pull Request for the repository **Prasanthikand/SFClaudeRepo** using GitHub MCP tools only. Never use git CLI for this operation.

## Instructions

1. **Determine the feature branch**
   - If the user has provided a branch name in $ARGUMENTS, use it exactly as given.
   - If no branch name was provided, **ask the user for the feature branch name before proceeding**. Do not assume or guess a branch name.

2. **Gather PR details**
   - Base branch: `main` (unless the user specifies otherwise)
   - Ask the user for a PR title and description if not already provided in $ARGUMENTS.
   - Summarise the components changed (Apex classes, LWC components, metadata, etc.) in the PR body if the context is available.

3. **Create the pull request**
   - Use `mcp__github__create_pull_request` targeting repository `Prasanthikand/SFClaudeRepo`.
   - Set `head` to the feature branch name provided by the user.
   - Set `base` to `main`.
   - Include a clear title and a descriptive body listing the changes.

4. **Confirm and report**
   - Return the PR URL to the user once created.
   - If creation fails, report the error message and ask the user how to proceed.

## Rules

- **Always** use GitHub MCP (`mcp__github__create_pull_request`) — never git CLI.
- **Never** assume or infer a feature branch name. If it is not supplied, stop and ask.
- **Never** target `main` or `master` as the head (source) branch.
- Do not merge the PR — only create it.

User input: $ARGUMENTS
