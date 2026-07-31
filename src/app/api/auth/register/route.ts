import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

/** Matches the cost factor the seed script uses for the demo account. */
const BCRYPT_ROUNDS = 12;

const EMAIL_TAKEN = "An account with that email already exists";

/**
 * `POST /api/auth/register` — creates a password account.
 *
 * This sits alongside the `[...nextauth]` catch-all; Next.js matches the static
 * `register` segment first, so it never reaches the Auth.js handler.
 *
 * An API route rather than a Server Action because the caller needs the status
 * code to tell a duplicate email (409) apart from a bad payload (400), and
 * because a future CLI client would post here too.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: EMAIL_TAKEN },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: { name, email, password: await hash(password, BCRYPT_ROUNDS) },
      // Never select the hash — this object goes straight into the response.
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    // Two requests can pass the check above at the same time; the unique index
    // on `users.email` is what actually decides, so report its verdict the same
    // way rather than as a server error.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: EMAIL_TAKEN },
        { status: 409 },
      );
    }

    console.error("Failed to register user:", error);

    return NextResponse.json(
      { success: false, error: "Could not create the account" },
      { status: 500 },
    );
  }
}
