## Project profile

- Platform: {{platform}}
- Audience: {{audience}}
- Status: {{projectStatus}}
- Launch: {{launchTarget}}
- Budget: {{budget}}
- Stack: {{techStack}}
- Requirements: see `context/knowledge/product.md`

## App development rules

### Working rules

- **A1.** Before changing code, read `context/knowledge/conventions.md` and `context/knowledge/techStack.md`.
- **A2.** When the stack changes (a new dependency or version), update `context/knowledge/techStack.md` and record a decision (M5).
- **A3.** When the structure changes (a new folder or pattern, or how to run or test the project), update `context/knowledge/conventions.md`.
- **A4.** When the scope changes, update `context/knowledge/product.md` and `context/knowledge/roadmap.md`.
- **A5.** After each change, run the project's tests or build if there are any. Record the exact commands in `context/knowledge/conventions.md` the first time you learn them.
- **A6.** Work on one task at a time. Finish it and tick it (M4) before starting the next.
- **A7.** Whenever {{userName}} has to do something (install, run, sign up, deploy), give numbered steps with exact commands and what they should see.

### Building a feature

- **A8. Plan before building.** When {{userName}} says "plan …" or runs `/plan`, describe before writing code:
  - what {{userName}} will be able to do
  - what is included and what is not
  - how they will check it works
  - whether it is roughly small, medium or large

  Get an OK. Then add the feature to `context/knowledge/roadmap.md` and its steps to **Current tasks** in `context/state.md`.
- **A9. Show and check.** When {{userName}} says "check", runs `/check`, asks "does it work?", or a feature is finished, give numbered steps for them to try, with the expected result for each. Mark the feature done in `roadmap.md` only after {{userName}} confirms it works. If it does not work, fix it and check again.

### Safety

- **A10. Ask when it matters.** Before building anything that touches a requirement marked "Not sure" in `product.md`, or a new need involving sign-in, stored data, personal data, payments, paid services or publishing, ask one plain-language question. Record the answer as a decision, update `product.md`, and remove it from **Open questions**.
- **A11. Keep an undo history.**
  - For a new project, set up git and explain it in one sentence as "an undo history for your project". Add a `.gitignore` covering secrets (`.env*`) and dependency folders.
  - For an existing project without git, offer to set it up.
  - Commit after every finished task with a plain message.
  - "undo that" means revert the last commit after confirming what will be undone.
- **A12. Ask before anything risky or costly:** deleting files or data; changing a database; deploying or publishing; installing global software; signing up for services; or anything that costs money. Stay within the budget ({{budget}}), and point out any cost before it happens.
- **A13. Stop when stuck.** After 3 failed attempts at the same problem, stop. Explain it in plain words, give 2–3 options, and recommend one.
- **A14. Security basics.** Never put secrets in code or memory files; use `.env` files that git ignores. For sign-in, payments or personal data, use established hosted services and never write password storage or card handling. Explain privacy implications in plain words.

### Getting set up

- **A15. Choosing a tech stack.** When no stack is chosen, recommend one popular, well-documented stack with a free tier that fits the platform, budget, launch target and requirements. If {{userName}} is new, or the platform is a phone app or undecided, recommend a website that works well on phones unless native phone features are truly needed. Explain trade-offs in at most 5 lines, record the decision (M5), and fill in `techStack.md`.
- **A16. Protect the kit files.** Never delete or overwrite `AGENTS.md`, `CLAUDE.md`, `START-HERE.md`, `context/`, `.claude/`, or `.cursor/`. If a scaffolding tool requires an empty folder, scaffold in a temporary subfolder, move its contents up, then delete only that temporary folder.
