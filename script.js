#!/usr/bin/env node
const path = require('path')
const fs = require('fs')

const sourcePath = path.join(__dirname, 'prisma/schema'); // Adjust the path as needed
const targetPath = path.join(process.cwd(), 'prisma/schema'); // Destination path


function copyFileIfNotExists(sourceFile, targetFile) {
  if (!fs.existsSync(targetFile)) {
    try {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Copied ${sourceFile} to ${targetFile}`);
    } catch (error) {
      console.error(`Failed to copy ${sourceFile} to ${targetFile}:`, error.message);
    }
  } else {
    console.log(`File ${targetFile} already exists. Skipping.`);
  }
}
const filesToCopy = [
  'schema.prisma',
  'chat-toolkits.prisma',
];

fs.mkdirSync(targetPath, { recursive: true });

filesToCopy.forEach(file => {
  const sourceFile = path.join(sourcePath, file);
  const targetFile = path.join(targetPath, file);

  // Ensure the source file exists before attempting to copy
  if (fs.existsSync(sourceFile)) {
    copyFileIfNotExists(sourceFile, targetFile);
  } else {
    console.error(`Source file ${sourceFile} does not exist. Skipping.`);
  }
});

console.log('All operations completed.');


fs.mkdirSync(targetPath, { recursive: true });

