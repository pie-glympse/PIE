import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_ID = __ENV.USER_ID || "1";
const COMPANY_ID = __ENV.COMPANY_ID || "1";
const EVENT_ID = __ENV.EVENT_ID || "1";
const CRON_SECRET = __ENV.CRON_SECRET || "";

// Auth pour les routes protégées (session NextAuth, JWT, etc.)
// - AUTH_TOKEN : Bearer token (ex. JWT) → en-tête Authorization: Bearer <token>
// - COOKIE : cookie de session (ex. next-auth.session-token=xxx) → en-tête Cookie
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";
const COOKIE = __ENV.COOKIE || "";

const defaultHeaders = {};
if (AUTH_TOKEN) defaultHeaders["Authorization"] = `Bearer ${AUTH_TOKEN}`;
if (COOKIE) defaultHeaders["Cookie"] = COOKIE;

function get(url, extraHeaders = {}) {
  return http.get(url, { headers: { ...defaultHeaders, ...extraHeaders } });
}

export const options = {
  stages: [{ duration: "20s", target: 1 }],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    /* http_req_failed: ["rate<0.1"], */
  },
};

const routes = [
  () => get(`${BASE_URL}/api/events?userId=${USER_ID}`),
  () => get(`${BASE_URL}/api/tags`),
  () => get(`${BASE_URL}/api/users?companyId=${COMPANY_ID}`),
  () => get(`${BASE_URL}/api/teams?companyId=${COMPANY_ID}`),
  () => get(`${BASE_URL}/api/company?userId=${USER_ID}`),
  () => get(`${BASE_URL}/api/stats?userId=${USER_ID}&period=month`),
  () => get(`${BASE_URL}/api/events/${EVENT_ID}`),
  () => get(`${BASE_URL}/api/events/${EVENT_ID}/popular-tag`),
  () => get(`${BASE_URL}/api/events/${EVENT_ID}/google-maps-tags`),
  () => get(`${BASE_URL}/api/blacklisted-places?companyId=${COMPANY_ID}`),
  () => get(`${BASE_URL}/api/feedback?eventId=${EVENT_ID}`),
];

if (CRON_SECRET) {
  routes.push(() =>
    get(`${BASE_URL}/api/health`, { Authorization: `Bearer ${CRON_SECRET}` }),
  );
}

export default function () {
  const pick = Math.floor(Math.random() * routes.length);
  const res = routes[pick]();
  check(res, { "status 2xx ou 4xx": (r) => r.status >= 200 && r.status < 500 });
  sleep(0.5 + Math.random() * 1);
}
