import { addIndustry } from './files.js';

function main(): void {
  const industryName = process.argv[2];
  if (!industryName) {
    console.error('Usage: npm run add-industry "<industry name>"');
    process.exitCode = 1;
    return;
  }
  const key = addIndustry(industryName);
  // Print only the key on stdout so CI can capture it.
  console.log(key);
}

main();
