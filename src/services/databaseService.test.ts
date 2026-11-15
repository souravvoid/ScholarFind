import { describe, test } from 'node:test';
import assert from 'node:assert';
import { 
  calculateDaysRemaining, 
  getDeadlineDisplay, 
  normalizeScholarshipWithCurrentDates 
} from './databaseService';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';

describe('ScholarFind Database Service & Date Standards', () => {
  test('calculateDaysRemaining accurately counts calendar days from UTC', () => {
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const days = calculateDaysRemaining(tomorrow.toISOString());
    assert(typeof days === 'number');
    assert(days >= 1 && days <= 2);

    // Past date (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDays = calculateDaysRemaining(yesterday.toISOString());
    assert(typeof pastDays === 'number');
    assert(pastDays < 0);
  });

  test('getDeadlineDisplay provides honest status without fabricating dates', () => {
    // Closed past deadline
    const closed = getDeadlineDisplay('2020-01-01');
    assert.strictEqual(closed.isClosed, true);
    assert.strictEqual(closed.daysRemaining, 0);
    assert(closed.statusLabel.includes('Cycle closed'));

    // Future deadline
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const open = getDeadlineDisplay(futureDate.toISOString());
    assert.strictEqual(open.isClosed, false);
    assert(typeof open.daysRemaining === 'number');
    assert(open.daysRemaining > 0);
    assert(open.statusLabel.includes('days remaining'));
  });

  test('normalizeScholarshipWithCurrentDates updates daysRemaining dynamically', () => {
    const raw = SCHOLARSHIPS_DATA[0];
    const norm = normalizeScholarshipWithCurrentDates(raw);
    assert(typeof norm.daysRemaining === 'number');
    assert.strictEqual(norm.id, raw.id);
  });
});
