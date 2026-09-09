import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { logger } from "./lib/logger";
import { requireDevice, registerDevice } from "./device-auth";

const app: Express = express();
app.set("trust proxy", 1);

const allowedBrowserOrigins = [
  /^https:\/\/[a-z0-9-]+\.replit\.dev$/,
  /^https:\/\/[a-z0-9-]+\.expo\.picard\.replit\.dev$/,
  /^https:\/\/[a-z0-9-]+\.picard\.replit\.dev$/,
  /^https:\/\/[a-z0-9-]+\.replit\.app$/,
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedBrowserOrigins.some((allowedOrigin) => allowedOrigin.test(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed to call the Call Guardian API."));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.post("/api/device/register", async (request, response, next) => {
  try {
    const { token } = await registerDevice(request, response);
    response.status(201).json({ token });
  } catch (error) {
    next(error);
  }
});
app.use("/api", requireDevice);

app.use("/api", router);
void registerRoutes(app);

export default app;
