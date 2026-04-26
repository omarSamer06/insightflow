import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorized, missing token");
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500);
      throw new Error("JWT_SECRET is not set");
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 401);
    next(error);
  }
}

