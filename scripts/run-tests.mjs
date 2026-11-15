import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('Run this test aggregator with `npm test`.');
  process.exitCode = 1;
} else {
  const suites = ['test:frontend', 'test:components', 'test:backend'];
  const failures = [];

  for (const suite of suites) {
    console.log(`\n=== ${suite} ===`);
    const result = spawnSync(process.execPath, [npmCli, 'run', suite], {
      stdio: 'inherit',
    });

    if (result.error) {
      console.error(`Could not start ${suite}: ${result.error.message}`);
      failures.push(suite);
    } else if (result.status !== 0) {
      const reason = result.signal ? `signal ${result.signal}` : `exit code ${result.status}`;
      console.error(`${suite} failed with ${reason}.`);
      failures.push(suite);
    }
  }

  if (failures.length > 0) {
    console.error(`\nFailed test suites: ${failures.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('\nAll test suites passed.');
  }
}
