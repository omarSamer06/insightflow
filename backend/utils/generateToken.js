import jwt from "jsonwebtoken";

export function generateToken(payload) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set");
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Token generation failed: ${message}`);
  }
}

