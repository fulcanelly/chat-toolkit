#!/usr/bin/env yarn tsx

import path from "path";




function copy() {

  const sourcePath = path.resolve(__dirname, '../..','/prisma/schema'); // Adjust the path as needed
  const targetPath = path.join(process.cwd(), 'prisma/schema'); // Destination path
}



const sourcePath = path.join(__dirname, 'prisma/schema'); // Adjust the path as needed
const targetPath = path.join(process.cwd(), 'prisma/schema'); // Destination path

console.log({
  sourcePath,
  targetPath
})
