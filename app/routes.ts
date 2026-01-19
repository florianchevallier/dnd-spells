import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/spells.tsx", [
    route("spells", "routes/spells._index.tsx"),
    route("update-db", "routes/update-db.tsx"),
  ]),
] satisfies RouteConfig;
