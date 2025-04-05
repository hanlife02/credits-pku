/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:46:02
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 13:11:11
 * @FilePath: /code/university-credits-app/backend/src/middleware/auth.middleware.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET_CHANGE_ME_IN_ENV";

// Define a custom interface extending Express Request
interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string }; // Add the user property
}
// backend/src/middleware/auth.middleware.ts
// ... imports ...
export const protect = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token;
  console.log("--- protect middleware:收到请求 ---"); // <-- 添加日志 1
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("--- protect middleware: 获取到 token ---"); // <-- 添加日志 2
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
      };
      console.log("--- protect middleware: Token 验证成功, decoded:", decoded); // <-- 添加日志 3
      req.user = decoded;
      console.log("--- protect middleware: 调用 next() ---"); // <-- 添加日志 4
      next();
    } catch (error) {
      console.error("--- protect middleware: Token 验证失败:", error); // <-- 添加日志 5
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  }
  if (
    !token &&
    !(
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
  ) {
    // 确保只在没有 Bearer token 时执行
    console.log("--- protect middleware: 未找到 token ---"); // <-- 添加日志 6
    res.status(401).json({ message: "Not authorized, no token." });
  }
};
