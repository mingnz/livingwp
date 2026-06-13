import { updateArticles } from './update.js';
import { formatUsageSummary } from './usage.js';

async function main(): Promise<void> {
  // Single optional positional arg: a comma-separated article filter.
  const articleFilter = process.argv[2] || undefined;

  console.log('Starting Living Whitepaper update...');
  const usageReport = await updateArticles(articleFilter);
  console.log(formatUsageSummary(usageReport));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
