import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const CATEGORY = __ENV.CATEGORY || "electronics";
const MIN_PRICE = __ENV.MIN_PRICE || "100";
const TOKEN = __ENV.TOKEN || "";

export const options = {
  scenarios: {
    products_load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 30 },
        { duration: "1m", target: 30 },
        { duration: "10s", target: 0 },
      ],
      tags: { scenario: "products_load_test" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  let url = `${BASE_URL}/api/products?category=${CATEGORY}&minPrice=${MIN_PRICE}`;
  if (TOKEN) url += `&token=${TOKEN}`;

  const res = http.get(url, { tags: { name: "products_load_test" } });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "returned 50 results": (r) => {
      try {
        return JSON.parse(r.body).returned === 50;
      } catch {
        return false;
      }
    },
  });
}
