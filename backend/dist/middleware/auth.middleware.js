"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET_CHANGE_ME_IN_ENV";
// backend/src/middleware/auth.middleware.ts
// ... imports ...
const protect = (req, res, next) => {
    let token;
    console.log("--- protect middleware:收到请求 ---"); // <-- 添加日志 1
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            console.log("--- protect middleware: 获取到 token ---"); // <-- 添加日志 2
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log("--- protect middleware: Token 验证成功, decoded:", decoded); // <-- 添加日志 3
            req.user = decoded;
            console.log("--- protect middleware: 调用 next() ---"); // <-- 添加日志 4
            next();
        }
        catch (error) {
            console.error("--- protect middleware: Token 验证失败:", error); // <-- 添加日志 5
            res.status(401).json({ message: "Not authorized, token failed." });
        }
    }
    if (!token &&
        !(req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer"))) {
        // 确保只在没有 Bearer token 时执行
        console.log("--- protect middleware: 未找到 token ---"); // <-- 添加日志 6
        res.status(401).json({ message: "Not authorized, no token." });
    }
};
exports.protect = protect;
