"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:37:20
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 00:37:33
 * @FilePath: /code/university-credits-app/backend/src/db.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/db.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.default = prisma;
