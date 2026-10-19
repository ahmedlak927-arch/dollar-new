import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ---------- PRISMA CLIENT ----------
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const latestRow = await prisma.currency.findFirst({
      orderBy: { id: "desc" },
    });

    if (!latestRow) {
      return NextResponse.json({ error: "No currency or gold data found" }, { status: 404 });
    }

    return NextResponse.json(latestRow, { status: 200 });
  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json({ error: "Failed to fetch data", details: err.message }, { status: 500 });
  }
}