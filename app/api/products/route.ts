import { NextRequest, NextResponse } from "next/server";
import { faker } from "@faker-js/faker";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: Date;
};

const TOTAL = 50_000;
const CATEGORIES = ["electronics", "books", "clothing", "home", "toys", "sports"];
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProducts: Product[] | null = null;
let cachedAt = 0;

function generateProducts(): Product[] {
  return Array.from({ length: TOTAL }, () => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(CATEGORIES),
    price: Number(faker.commerce.price({ min: 1, max: 2000 })),
    stock: faker.number.int({ min: 0, max: 500 }),
    createdAt: faker.date.past({ years: 2 }),
  }));
}

function getProducts(): { products: Product[]; cacheHit: boolean } {
  const now = Date.now();
  if (cachedProducts && now - cachedAt < CACHE_TTL_MS) {
    return { products: cachedProducts, cacheHit: true };
  }
  cachedProducts = generateProducts();
  cachedAt = now;
  return { products: cachedProducts, cacheHit: false };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (process.env.NODE_ENV === "production") {
    const token = searchParams.get("token");
    if (!process.env.CPU_TEST_TOKEN || token !== process.env.CPU_TEST_TOKEN) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const category = searchParams.get("category") || "electronics";
  const minPrice = Number(searchParams.get("minPrice")) || 100;

  const t0 = Date.now();

  const { products, cacheHit } = getProducts();
  const tGen = Date.now();

  const filtered = products
    .filter((p) => p.category === category)
    .filter((p) => p.price > minPrice)
    .filter((p) => p.stock > 0);

  const sorted = filtered.sort((a, b) => {
    if (b.price !== a.price) return b.price - a.price;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const results = sorted.slice(0, 50).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    createdAt: p.createdAt.toISOString(),
  }));

  const tEnd = Date.now();

  return NextResponse.json({
    total: TOTAL,
    matched: filtered.length,
    returned: results.length,
    timings: {
      cacheHit,
      generateMs: tGen - t0,
      filterSortMs: tEnd - tGen,
      totalMs: tEnd - t0,
    },
    results,
  });
}
