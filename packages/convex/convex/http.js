import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Serves Better Auth at /api/auth/* (the Next.js app forwards its /api/auth requests here).
authComponent.registerRoutes(http, createAuth);

export default http;
