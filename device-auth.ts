import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { storage } from "./storage";

const DEVICE_HEADER = "x-call-guardian-device-token";
const DEVICE_COOKIE = "call_guardian_device";
const PUBLIC_PATHS = new Set(["/healthz", "/device/register"]);
const SYSTEM_WEBHOOKS = new Set([
  "/calls/incoming",
  "/calls/handle-keypress",
  "/sms/incoming",
]);

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

function isBrowserRequest(request: Request): boolean {
  return Boolean(request.get("origin") || request.get("referer"));
}

export async function registerDevice(request: Request, response: Response) {
  const token = createDeviceToken();
  const device = await storage.createDevice(hashDeviceToken(token));

  if (isBrowserRequest(request)) {
    response.cookie(DEVICE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.secure || request.get("x-forwarded-proto") === "https",
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return { token, device };
}

export async function requireDevice(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    request.method === "OPTIONS" ||
    PUBLIC_PATHS.has(request.path) ||
    SYSTEM_WEBHOOKS.has(request.path) ||
    (request.method === "GET" && request.path.startsWith("/emergency-services"))
  ) {
    next();
    return;
  }

  const suppliedToken = request.get(DEVICE_HEADER) ?? request.cookies?.[DEVICE_COOKIE];
  if (suppliedToken) {
    const device = await storage.getDeviceByTokenHash(hashDeviceToken(suppliedToken));
    if (!device) {
      response.status(401).json({ message: "This device is not authorized." });
      return;
    }

    response.locals.guardianDeviceId = device.id;
    void storage.touchDevice(device.id);
    next();
    return;
  }

  if (isBrowserRequest(request)) {
    const { device } = await registerDevice(request, response);
    response.locals.guardianDeviceId = device.id;
    next();
    return;
  }

  response.status(401).json({ message: "A Call Guardian device key is required." });
}