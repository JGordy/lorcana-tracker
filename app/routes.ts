import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("decks", "routes/decks.tsx"),
  route("collection", "routes/collection.tsx"),
] satisfies RouteConfig;
