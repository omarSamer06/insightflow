import mongoose from "mongoose";

const memberEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { _id: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: {
      type: [memberEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ "members.user": 1 });

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
