import { test } from "node:test";
import assert from "node:assert/strict";
import {
  periodFor, addMonths, isPrepaid, amountInArabicWords, numberToArabicWords,
  formatKwd, splitKwd, monthLabel, dateLabel, todayKuwait,
} from "../lib/rules.ts";

test("«عن شهر»: أول الشهر لنفس الشهر، آخر الشهر للشهر اللي بعده", () => {
  assert.equal(periodFor("2026-11-04", 15), "2026-11-01");
  assert.equal(periodFor("2026-11-15", 15), "2026-11-01");
  assert.equal(periodFor("2026-11-16", 15), "2026-12-01");
  assert.equal(periodFor("2026-10-28", 15), "2026-11-01");
  assert.equal(periodFor("2026-12-20", 15), "2027-01-01");
  assert.equal(periodFor("2026-12-20", 25), "2026-12-01");
});

test("addMonths عبر السنوات", () => {
  assert.equal(addMonths("2026-11-01", 1), "2026-12-01");
  assert.equal(addMonths("2026-12-01", 1), "2027-01-01");
  assert.equal(addMonths("2026-01-01", -1), "2025-12-01");
  assert.equal(addMonths("2026-11-01", -5), "2026-06-01");
});

test("isPrepaid", () => {
  assert.equal(isPrepaid("2026-10-28", "2026-11-01"), true);
  assert.equal(isPrepaid("2026-11-04", "2026-11-01"), false);
  assert.equal(isPrepaid("2026-11-04", null), false);
});

test("المبلغ بالحروف", () => {
  assert.equal(amountInArabicWords(35), "خمسة وثلاثون دينار كويتي فقط لا غير");
  assert.equal(amountInArabicWords(10), "عشرة دنانير كويتية فقط لا غير");
  assert.equal(amountInArabicWords(1), "دينار كويتي واحد فقط لا غير");
  assert.equal(amountInArabicWords(2), "ديناران كويتيان فقط لا غير");
  assert.equal(amountInArabicWords(140.5), "مائة وأربعون دينار كويتي وخمسمائة فلس فقط لا غير");
  assert.equal(amountInArabicWords(0.25), "مائتان وخمسون فلس فقط لا غير");
  assert.equal(numberToArabicWords(1245), "ألف ومائتان وخمسة وأربعون");
  assert.equal(numberToArabicWords(3000), "ثلاثة آلاف");
  assert.equal(numberToArabicWords(21), "واحد وعشرون");
  assert.equal(numberToArabicWords(111), "مائة وأحد عشر");
});

test("تنسيق الدينار", () => {
  assert.equal(formatKwd(1245.5), "1,245.500");
  assert.equal(formatKwd("35"), "35.000");
  assert.deepEqual(splitKwd(35.25), { dinars: 35, fils: 250 });
  assert.deepEqual(splitKwd(0.1 + 0.2), { dinars: 0, fils: 300 });
});

test("أسماء الشهور والتواريخ", () => {
  assert.equal(monthLabel("2026-11-01"), "نوفمبر 2026");
  assert.equal(dateLabel("2026-10-04"), "4 أكتوبر 2026");
  assert.match(todayKuwait(new Date("2026-11-04T22:30:00Z")), /^2026-11-05$/);
});
