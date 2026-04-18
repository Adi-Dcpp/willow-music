import crypto from "crypto";

export const generateShareId = () => {
  return crypto.randomBytes(6).toString("hex"); // short + unique
};