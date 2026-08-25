import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import { API_BODY_LIMIT } from "../../shared/importLimits";
import { assertSessionSecretConfigured } from "../../server/auth";

assertSessionSecretConfigured();
const api = express();
api.use(express.json({ limit: API_BODY_LIMIT }));
api.use(express.urlencoded({ extended: true, limit: API_BODY_LIMIT }));
api.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api\/trpc/, "") || "/";
  next();
});
api.use(createExpressMiddleware({ router: appRouter, createContext }));

export default api;
