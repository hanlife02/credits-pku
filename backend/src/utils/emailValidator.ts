/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:36:19
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 00:36:24
 * @FilePath: /code/university-credits-app/backend/src/utils/emailValidator.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/utils/emailValidator.ts

const ALLOWED_DOMAINS = ["stu.pku.edu.cn", "pku.edu.cn"];

export function isValidPkuEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  const lowerEmail = email.toLowerCase();
  const parts = lowerEmail.split("@");
  if (parts.length !== 2) {
    return false; // Invalid email format
  }
  const domain = parts[1];
  return ALLOWED_DOMAINS.includes(domain);
}
