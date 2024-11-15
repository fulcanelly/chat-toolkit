#!/usr/bin/env node
const path = require('path')

const sourcePath = path.join(__dirname, 'prisma/schema'); // Adjust the path as needed
const targetPath = path.join(process.cwd(), 'prisma/schema'); // Destination path

console.log({
  sourcePath,
  targetPath
})
