import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// Demo-only in-memory user (for take-home simplicity)
const demoUser = {
  id: "demo-user",
  email: "demo@tenex.local",
  passwordHash: bcrypt.hashSync("password", 10)
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (email !== demoUser.email) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(password ?? "", demoUser.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: demoUser.id }, process.env.JWT_SECRET ?? "dev" , {
    expiresIn: "1h"
  });

  return res.json({ token });
});

export default router;
