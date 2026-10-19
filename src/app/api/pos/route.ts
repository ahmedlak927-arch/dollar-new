import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prisma client initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {}; // Fallback if no body is provided
    }

    // Build payload from request body or use default mock test data
    const dataToInsert = {
      USD: body.USD || "168,000 IQD",
      EUR: body.EUR || "180,000 IQD",
      GBP: body.GBP || "210,000 IQD",
      TRY: body.TRY || "3,500 IQD",
      CNY: body.CNY || "25,000 IQD",
      GOLD_22: body.GOLD_22 || "1,034,000 IQD",
      GOLD_21: body.GOLD_21 || "988,000 IQD",
      GOLD_18: body.GOLD_18 || "846,000 IQD",
    };

    // Attempt to insert via Prisma
    const newRow = await prisma.currency.create({
      data: dataToInsert,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully inserted data via Prisma POST!",
        insertedRow: newRow,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Prisma POST Insert Error:", error);

    // Return detailed error response to diagnose the exact issue
    return NextResponse.json(
      {
        success: false,
        message: "Prisma POST insert failed",
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code, // Prisma code (e.g. P2002, P2021) or DB code
        meta: error.meta,
      },
      { status: 500 }
    );
  }
}