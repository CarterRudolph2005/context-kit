# Context Kit

Context Kit is a static web app that turns a short questionnaire into a downloadable folder of
Markdown files. The generated kit gives an AI coding tool a durable project memory, working rules,
and a user-chosen name. It supports research and app-development projects without accounts or a
backend.

## Development

Install dependencies, then run the development server:

```sh
npm install
npm start
```

Run the test suite once:

```sh
npm test -- --watch=false
```

Create a production build:

```sh
npm run build
```

The Markdown content included in generated kits lives in `kit-templates/`. The pre-start,
pre-test, and pre-build scripts compile those files into a TypeScript module used by the app.

## Deploying to Vercel

Use these project settings:

- Framework: Angular
- Build: `npm run build`
- Output: `dist/context-kit/browser`
