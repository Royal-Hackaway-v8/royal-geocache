#!/bin/bash

# Define the output file
OUTPUT_FILE="combined_files.txt"

# Clear or create the output file (exclude it from being processed)
> "$OUTPUT_FILE"

# Function to add a separator between files
add_separator() {
  echo "==========================" >> "$OUTPUT_FILE"
  echo "File: $1" >> "$OUTPUT_FILE"
  echo "==========================" >> "$OUTPUT_FILE"
}

# Corrected find command to properly exclude directories and files
find . \( \
    -path "./node_modules" -o \
    -path "./.next" -o \
    -path "./.git" -o \
    -path "./node_modules/*" -o \
    -path "./.next/*" -o \
    -path "./.git/*" \
\) -prune -o -type f \( \
    ! -name ".DS_Store" \
    ! -name "*.ico" \
    ! -name "*.md" \
    ! -name "*.config.*" \
    ! -name "*.lock" \
    ! -name "next-env.d.ts" \
    ! -name "next.config.ts" \
    ! -name "tsconfig.json" \
    ! -name "postcss.config.js" \
    ! -name "tailwind.config.ts" \
    ! -name "*.env*" \
    ! -name ".prettierrc" \
    ! -name ".prettierrc.*" \
    ! -name "combine_files.sh" \
    ! -name "combined_files.txt" \
    ! -name "*.json" -o -name "package.json" \
\) -print | while read -r file; do
# Log the file being processed
echo "Processing: $file"

# Add separator and file contents to the output file
add_separator "$file"
cat "$file" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"  # Add a blank line for spacing
done

echo "All file contents have been combined into $OUTPUT_FILE."
