import mongoose from "mongoose";

import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { generateToken } from "../utils/generateToken.js";

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspace: user.workspace,
  };
}

function forwardError(next, res, error) {
  if (typeof next === "function") return next(error);
  // Fallback: ensure we still respond instead of throwing "next is not a function"
  const message = error instanceof Error ? error.message : "Server error";
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json({ success: false, message, data: null });
}

export async function registerUser(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { name, email, password } = req.body || {};

    const trimmedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!trimmedName) {
      res.status(400);
      throw new Error("Name is required");
    }
    if (!isValidEmail(normalizedEmail)) {
      res.status(400);
      throw new Error("Valid email is required");
    }
    if (rawPassword.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error("Email is already in use");
    }

    session.startTransaction();

    const user = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: rawPassword,
      role: "admin",
    });
    await user.save({ session });

    const workspaceName = `${trimmedName}'s Workspace`;
    const workspace = new Workspace({
      name: workspaceName,
      owner: user._id,
      members: [{ user: user._id, role: "admin" }],
    });
    await workspace.save({ session });

    user.workspace = workspace._id;
    await user.save({ session });

    await session.commitTransaction();

    const token = generateToken({ id: user._id });
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: sanitizeUser(user),
        workspace: {
          id: workspace._id,
          name: workspace.name,
          owner: workspace.owner,
          members: workspace.members,
        },
      },
    });
  } catch (error) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch {
      // ignore abort errors
    }
    return forwardError(next, res, error);
  } finally {
    session.endSession();
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!isValidEmail(normalizedEmail)) {
      res.status(400);
      throw new Error("Valid email is required");
    }
    if (!rawPassword) {
      res.status(400);
      throw new Error("Password is required");
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.matchPassword(rawPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const token = generateToken({ id: user._id });
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return forwardError(next, res, error);
  }
}

