# Lorcana Tracker & Deck Builder

A modern, full-stack web application designed for Disney Lorcana TCG players to manage their collections and build decks.

## Features

- 🎴 **Collection Management**: Track owned cards with support for quantities, foil variants, set numbers, and ink colors.
- 🛠️ **Deck Building**: Design custom decks, toggle deck privacy, and view detailed card breakdowns.
- 📊 **Progress Calculations**: Automatically calculate collection progress for any deck, showing overall percentage and listing specific missing cards.
- ⚡ **Modern Stack**: Built with React Router (v8), TypeScript, Tailwind CSS, and Mantine UI components for a premium user interface.
- 🔌 **Appwrite Integration**: Configured with Appwrite for secure database storage and user authentication, featuring a fully functional cookie-based local fallback for testing without configuration.

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Testing

Run the unit test suite:

```bash
npm run test
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t lorcana-tracker .

# Run the container
docker run -p 3000:3000 lorcana-tracker
```

The containerized application can be deployed to any platform that supports Docker (e.g., AWS ECS, Google Cloud Run, Azure Container Apps, etc.).

### DIY Deployment

If you're deploying manually, the built-in app server is production-ready. Make sure to deploy the output of `npm run build`:

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

---

Built with ❤️ using React Router and Mantine.
