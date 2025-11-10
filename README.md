# My Astro Site

This site was created with **wp2astro** - migrated from WordPress to Astro.

## 🚀 Project Structure

```
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro`, `.md`, or `.mdx` files in the `src/pages/` directory. Each page is exposed as a route based on its file name. MDX files allow you to use React components and access frontmatter fields directly in your content.

## 🧞 Commands

All commands are run from the root of the project:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`        | Installs dependencies                            |
| `npm run dev`        | Starts local dev server at `localhost:4321`    |
| `npm run build`      | Build your production site to `./dist/`        |
| `npm run preview`    | Preview your build locally, before deploying     |

## 📚 Documentation

Check out [Astro documentation](https://docs.astro.build) or jump into the [Discord server](https://astro.build/chat).

## 🎯 Created with wp2astro

Learn more about migrating from WordPress to Astro at [wp2astro.com](https://wp2astro.com)
