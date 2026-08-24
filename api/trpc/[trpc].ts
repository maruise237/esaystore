import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const api = express();
api.use(express.json({ limit: "1mb" }));
api.use(express.urlencoded({ extended: true, limit: "1mb" }));
api.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api\/trpc/, "") || "/";
  next();
});
api.use(createExpressMiddleware({ router: appRouter, createContext }));

export default api;
