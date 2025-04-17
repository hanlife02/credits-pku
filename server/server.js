/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-17 17:08:11
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-17 17:29:37
 * @FilePath: /credits-pku/server/server.js
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
