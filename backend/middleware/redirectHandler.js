import { logger } from "./errorHandler.js";

// Redirect configuration
const REDIRECT_RULES = {
  // Legacy paths to new paths
  "/dashboard": "/admin",
  "/admin-panel": "/admin",
  "/administrator": "/admin",
  "/admins": "/admin",
  "/login": "/admin",

  // API v1 to v2 redirects
  "/api/v1/auth/login": "/api/auth/login",
  "/api/v1/users": "/api/user",
  "/api/v1/health": "/api/health",

  // Old contest paths
  "/vote": "/",
  "/voting": "/",
  "/contests": "/",

  // SEO-friendly URLs
  "/contest": "/contest/:id",
  "/user-profile": "/profile",
  "/leaderboards": "/leaderboard",

  // Common typos
  "/adimn": "/admin",
  "/logni": "/admin",
  "/dashbaord": "/admin",
  "/administratro": "/admin",
};

// Temporary redirects (302)
const TEMPORARY_REDIRECTS = {
  "/maintenance": "/api/health",
  "/status": "/api/health",
};

// Permanent redirects with custom status codes
const CUSTOM_REDIRECTS = {
  // Moved permanently
  "/old-admin": { url: "/admin", status: 301 },
  "/legacy": { url: "/", status: 301 },

  // Found (temporary)
  "/temp-page": { url: "/", status: 302 },

  // See Other
  "/submit": { url: "/", status: 303 },
};

// SEO redirect middleware
export const seoRedirectMiddleware = (req, res, next) => {
  const { path, method } = req;

  // Only handle GET requests for SEO
  if (method !== "GET") {
    return next();
  }

  // Check for trailing slashes and normalize
  if (path.endsWith("/") && path.length > 1) {
    const normalizedPath = path.slice(0, -1);
    logger.info("Redirecting trailing slash", {
      from: path,
      to: normalizedPath,
    });
    return res.redirect(
      301,
      normalizedPath +
        (req.url.includes("?") ? "?" + req.url.split("?")[1] : "")
    );
  }

  // Check for custom redirects first
  if (CUSTOM_REDIRECTS[path]) {
    const redirect = CUSTOM_REDIRECTS[path];
    logger.info("Custom redirect", {
      from: path,
      to: redirect.url,
      status: redirect.status,
    });
    return res.redirect(redirect.status, redirect.url);
  }

  // Check for permanent redirects
  if (REDIRECT_RULES[path]) {
    const redirectTo = REDIRECT_RULES[path];
    logger.info("Permanent redirect", { from: path, to: redirectTo });
    return res.redirect(301, redirectTo);
  }

  // Check for temporary redirects
  if (TEMPORARY_REDIRECTS[path]) {
    const redirectTo = TEMPORARY_REDIRECTS[path];
    logger.info("Temporary redirect", { from: path, to: redirectTo });
    return res.redirect(302, redirectTo);
  }

  next();
};

// Mobile redirect middleware
export const mobileRedirectMiddleware = (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const isMobile =
    /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const { path } = req;

  // If mobile user accessing desktop-only pages
  if (isMobile && path.startsWith("/admin")) {
    const mobileWarning = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cảnh báo thiết bị di động</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 2rem;
            background: linear-gradient(135deg, #ff9a56, #ff6b6b);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
          }
          .warning-icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; line-height: 1.6; }
          .btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: all 0.3s ease;
          }
          .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="warning-icon">📱</div>
          <h1>Cảnh báo</h1>
          <p>Giao diện quản trị được tối ưu cho máy tính để bàn. Trải nghiệm trên thiết bị di động có thể không tối ưu.</p>
          <a href="${path}" class="btn">Tiếp tục</a>
          <a href="/" class="btn">Về trang chủ</a>
        </div>
        <script>
          setTimeout(() => {
            if (confirm('Bạn có muốn tiếp tục với giao diện quản trị trên thiết bị di động?')) {
              window.location.href = '${path}';
            } else {
              window.location.href = '/';
            }
          }, 3000);
        </script>
      </body>
      </html>
    `;

    return res.status(200).send(mobileWarning);
  }

  next();
};

// Subdomain redirect middleware
export const subdomainRedirectMiddleware = (req, res, next) => {
  const host = req.headers.host;
  const subdomain = host ? host.split(".")[0] : "";

  // Handle www subdomain
  if (subdomain === "www") {
    const redirectUrl = `https://${host.replace("www.", "")}${req.originalUrl}`;
    logger.info("WWW redirect", { from: host, to: redirectUrl });
    return res.redirect(301, redirectUrl);
  }

  // Handle specific subdomains
  switch (subdomain) {
    case "admin":
      return res.redirect(
        301,
        `https://${host.replace("admin.", "")}/admin${req.originalUrl}`
      );
    case "api":
      return res.redirect(
        301,
        `https://${host.replace("api.", "")}/api${req.originalUrl}`
      );
    case "m":
    case "mobile":
      // Mobile subdomain handling
      req.isMobileSubdomain = true;
      break;
  }

  next();
};

// HTTPS redirect middleware - Disabled for development
export const httpsRedirectMiddleware = (req, res, next) => {
  // Only redirect in production AND with proper reverse proxy setup
  if (
    process.env.NODE_ENV === "production" &&
    process.env.FORCE_HTTPS === "true"
  ) {
    if (req.headers["x-forwarded-proto"] !== "https") {
      const redirectUrl = `https://${req.headers.host}${req.originalUrl}`;
      logger.info("HTTPS redirect", { from: req.originalUrl, to: redirectUrl });
      return res.redirect(301, redirectUrl);
    }
  }
  next();
};

// Bot and crawler handling
export const botRedirectMiddleware = (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const isBot = /bot|crawler|spider|scraper/i.test(userAgent);

  if (isBot) {
    // For bots accessing admin areas, redirect to public pages
    if (req.path.startsWith("/admin")) {
      logger.info("Bot redirect from admin", { userAgent, path: req.path });
      return res.redirect(301, "/");
    }

    // Set special headers for bots
    res.set("X-Robots-Tag", "noindex, nofollow");
    req.isBot = true;
  }

  next();
};

// URL canonicalization
export const canonicalUrlMiddleware = (req, res, next) => {
  let { path } = req;

  // Convert to lowercase
  if (path !== path.toLowerCase()) {
    const canonicalPath = path.toLowerCase();
    logger.info("Canonical redirect - lowercase", {
      from: path,
      to: canonicalPath,
    });
    return res.redirect(
      301,
      canonicalPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "")
    );
  }

  // Remove double slashes
  if (path.includes("//")) {
    const canonicalPath = path.replace(/\/+/g, "/");
    logger.info("Canonical redirect - double slash", {
      from: path,
      to: canonicalPath,
    });
    return res.redirect(
      301,
      canonicalPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "")
    );
  }

  next();
};

// Legacy API version redirect
export const apiVersionRedirectMiddleware = (req, res, next) => {
  if (req.path.startsWith("/api/v1/")) {
    const newPath = req.path.replace("/api/v1/", "/api/");
    logger.info("API version redirect", { from: req.path, to: newPath });
    return res.redirect(301, newPath);
  }

  next();
};

// Combined redirect middleware - HTTPS disabled for development
export const redirectMiddleware = [
  // httpsRedirectMiddleware, // Disabled for development
  subdomainRedirectMiddleware,
  canonicalUrlMiddleware,
  botRedirectMiddleware,
  mobileRedirectMiddleware,
  apiVersionRedirectMiddleware,
  seoRedirectMiddleware,
];

// Redirect stats tracking
let redirectStats = {
  total: 0,
  byType: {},
  byPath: {},
};

export const getRedirectStats = () => redirectStats;

export const trackRedirect = (type, from, to) => {
  redirectStats.total++;
  redirectStats.byType[type] = (redirectStats.byType[type] || 0) + 1;
  redirectStats.byPath[from] = (redirectStats.byPath[from] || 0) + 1;

  logger.info("Redirect tracked", { type, from, to, stats: redirectStats });
};

export default {
  redirectMiddleware,
  seoRedirectMiddleware,
  mobileRedirectMiddleware,
  subdomainRedirectMiddleware,
  httpsRedirectMiddleware,
  botRedirectMiddleware,
  canonicalUrlMiddleware,
  apiVersionRedirectMiddleware,
  getRedirectStats,
  trackRedirect,
};
