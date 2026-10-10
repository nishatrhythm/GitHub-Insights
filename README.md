<h1 align="center">GitHub Insights</h1>

<p align="center">
  <img src="https://yourinsights.vercel.app/api/insight?username=mojombo&theme=github_dark&graph=true&languages=true&streak=true&stats=true&header=true&summary=true&profile=true" alt="GitHub Insights" />
</p>

<p align="center">
  <strong>Generate beautiful, customizable GitHub stats cards for your profile README</strong>
</p>

<p align="center">
  <a href="https://yourinsights.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#usage">Usage</a> •
  <a href="#themes">Themes</a> •
  <a href="#self-hosting">Self-Hosting</a>
</p>

---

## Features

- 📊 **Comprehensive Stats** - Commits, PRs, issues, stars, and more
- 🔥 **Streak Tracking** - Current and longest contribution streaks with accurate consecutive day detection
- 📈 **Contribution Graph** - Visual representation of your activity with monthly breakdowns
- 🗣️ **Top Languages** - Most used programming languages with visual percentages
- 🙈 **Language Filtering** - Hide specific languages from your stats so percentages only reflect what matters to you
- 🎨 **Multiple Themes** - 12 beautiful card themes to choose from (GitHub Dark, GitHub Light, Monochrome, Monochrome Light, Radical, Tokyo Night, Dracula, Synthwave, Ocean, Neo Green and more)
- 🌗 **Site Theme Toggle** - Switch the web UI between Light, Dark, and System mode with persistent preference
- 📥 **Download Options** - Export your stats card as SVG, PNG, or JPG directly from the UI
- ⚡ **Fast & Optimized** - Edge runtime with intelligent caching for quick loads
- 📱 **Responsive Design** - Looks great on any device with a fully mobile-friendly interface
- 🔄 **Smart Regeneration UX** - The Generate button and a banner highlight automatically when your settings have changed since the last card was generated, and clear automatically if you revert to the previously generated configuration

## Usage

### Quick Start

Add this to your GitHub profile README:

```markdown
<p align="center">
  <img src="https://yourinsights.vercel.app/api/insight?username=YOUR_USERNAME" alt="GitHub Insights" />
</p>
```

Replace `YOUR_USERNAME` with your GitHub username.

### Customization Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `username` | Required | Your GitHub username |
| `theme` | `github_dark` | Card theme |
| `profile` | `true` | Show name & username |
| `header` | `true` | Show monthly contribution chart |
| `summary` | `true` | Show summary info (contributions, repos, join date) |
| `stats` | `true` | Show GitHub stats (commits, PRs, issues, stars) |
| `languages` | `true` | Show top programming languages |
| `streak` | `true` | Show streak statistics |
| `graph` | `true` | Show contribution graph |
| `border` | `true` | Show outer card border |
| `hide_langs` | _(none)_ | Comma-separated list of languages to exclude from the languages section (e.g. `HTML,CSS`). Remaining language percentages are recalculated automatically. |

### Example with All Options

```markdown
<p align="center">
  <img src="https://yourinsights.vercel.app/api/insight?username=YOUR_USERNAME&theme=radical&graph=true&languages=true&streak=true&stats=true&header=true&summary=true&profile=true" alt="GitHub Insights" />
</p>
```

### Hiding Specific Languages

You can exclude certain languages so they don't appear in the languages section and their percentages are redistributed among the remaining ones:

```markdown
<p align="center">
  <img src="https://yourinsights.vercel.app/api/insight?username=YOUR_USERNAME&theme=github_light&languages=true&hide_langs=HTML,CSS" alt="GitHub Insights" />
</p>
```

## Themes

| Theme | Preview |
|-------|---------|
| `github_dark` (default) | ![GitHub Dark](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=github_dark&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `github_light` | ![GitHub Light](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=github_light&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `monochrome` | ![Monochrome](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=monochrome&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `monochrome_light` | ![Monochrome Light](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=monochrome_light&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `radical` | ![Radical](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=radical&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `tokyonight` | ![Tokyo Night](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=tokyonight&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `dracula` | ![Dracula](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=dracula&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `synthwave` | ![Synthwave](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=synthwave&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `ocean` | ![Ocean](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=ocean&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |
| `neo_green` | ![Neo Green](https://yourinsights.vercel.app/api/insight?username=mojombo&theme=neo_green&graph=false&languages=false&streak=false&stats=false&header=false&summary=false&profile=true) |

## Self-Hosting

### Prerequisites

- Node.js 20+
- GitHub Personal Access Token

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nishatrhythm/GitHub-Insights.git
   cd GitHub-Insights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Add your GitHub token**
   
   Create a [Personal Access Token](https://github.com/settings/tokens) with the following scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read all user profile data)
   
   Add it to `.env.local`:
   ```
   GITHUB_TOKEN=your_token_here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Deploy to Diploi

[![launch with diploi button](https://diploi.com/launch-big.svg)](https://diploi.com/launch/nishatrhythm/GitHub-Insights)

**Important:** In Diploi, open **Deployment Page -> Options -> Next.js -> Environment** and add the `GITHUB_TOKEN` environment variable.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nishatrhythm/GitHub-Insights&env=GITHUB_TOKEN)

**Important:** Add the `GITHUB_TOKEN` environment variable in your Vercel project settings.


## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Runtime:** Edge Runtime for optimal performance
- **Language:** TypeScript for type safety
- **Styling:** Inline SVG with dynamic theming
- **Font:** Inter for consistent cross-platform rendering
- **API:** GitHub GraphQL API v4
- **Image Export:** Canvas API for PNG/JPG conversion
- **Deployment:** Vercel with automatic edge caching

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Free and open source</strong><br>
  Made with ❤️ by <a href="https://github.com/nishatrhythm">nishatrhythm</a> and <a href="https://github.com/nishatrhythm/GitHub-Insights/graphs/contributors">other contributors</a>
</p>
