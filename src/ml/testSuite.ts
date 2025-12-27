/**
 * ML Algorithm Test Suite
 * Test and calibrate phonetic matching algorithms
 */

import { analyzePronunciation, levenshteinDistance } from '../ml/phoneticAnalyzer';
import { getPhoneticVariations } from '../ml/arabicPhonetics';

// Test cases for phonetic matching
const testCases = [
  // Perfect matches
  { letter: 'أ', spoken: 'alif', expectedMin: 90 },
  { letter: 'أ', spoken: 'aa', expectedMin: 85 },
  { letter: 'ب', spoken: 'baa', expectedMin: 90 },
  { letter: 'ت', spoken: 'taa', expectedMin: 90 },
  
  // Good matches
  { letter: 'ج', spoken: 'jeem', expectedMin: 85 },
  { letter: 'ح', spoken: 'haa', expectedMin: 85 },
  { letter: 'خ', spoken: 'khaa', expectedMin: 85 },
  { letter: 'د', spoken: 'daal', expectedMin: 85 },
  
  // Acceptable variations
  { letter: 'أ', spoken: 'alef', expectedMin: 75 },
  { letter: 'ب', spoken: 'ba', expectedMin: 80 },
  { letter: 'ت', spoken: 'ta', expectedMin: 80 },
  { letter: 'ج', spoken: 'ja', expectedMin: 75 },
  
  // Common mispronunciations (should still score reasonably)
  { letter: 'ب', spoken: 'pa', expectedMin: 60 },
  { letter: 'ث', spoken: 'sa', expectedMin: 60 },
  { letter: 'خ', spoken: 'kha', expectedMin: 70 },
  
  // Poor matches (should score low)
  { letter: 'أ', spoken: 'zee', expectedMin: 0, expectedMax: 40 },
  { letter: 'ب', spoken: 'qaf', expectedMin: 0, expectedMax: 40 },
  { letter: 'ت', spoken: 'noon', expectedMin: 0, expectedMax: 40 },
];

/**
 * Run test suite and generate report
 */
export const runMLTests = () => {
  console.log('='.repeat(60));
  console.log('ML ALGORITHM TEST SUITE');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;
  const results: any[] = [];
  
  testCases.forEach((test, index) => {
    const result = analyzePronunciation(test.letter, test.spoken);
    const passed = test.expectedMax 
      ? (result.accuracy >= test.expectedMin && result.accuracy <= test.expectedMax)
      : (result.accuracy >= test.expectedMin);
    
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
    
    results.push({
      test: `Test ${index + 1}`,
      letter: test.letter,
      spoken: test.spoken,
      score: result.accuracy,
      expected: test.expectedMax ? `${test.expectedMin}-${test.expectedMax}` : `>=${test.expectedMin}`,
      passed,
      feedback: result.feedback,
      details: result.detailedScores,
    });
    
    console.log(`\nTest ${index + 1}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Letter: ${test.letter}`);
    console.log(`  Spoken: "${test.spoken}"`);
    console.log(`  Score: ${result.accuracy}% (Expected: ${test.expectedMax ? `${test.expectedMin}-${test.expectedMax}` : `>=${test.expectedMin}`})`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Feedback: "${result.feedback}"`);
    console.log(`  Detailed Scores:`);
    console.log(`    - Levenshtein: ${result.detailedScores.levenshtein}%`);
    console.log(`    - Phonetic: ${result.detailedScores.phonetic}%`);
    console.log(`    - Substring: ${result.detailedScores.substring}%`);
    console.log(`    - Consonant: ${result.detailedScores.consonant}%`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests / testCases.length * 100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests / testCases.length * 100)}%)`);
  console.log('='.repeat(60));
  
  return {
    totalTests: testCases.length,
    passedTests,
    failedTests,
    passRate: Math.round(passedTests / testCases.length * 100),
    results,
  };
};

/**
 * Test Levenshtein distance algorithm
 */
export const testLevenshtein = () => {
  console.log('\n' + '='.repeat(60));
  console.log('LEVENSHTEIN DISTANCE TESTS');
  console.log('='.repeat(60));
  
  const tests = [
    { str1: 'alif', str2: 'alif', expected: 0 },
    { str1: 'alif', str2: 'alef', expected: 1 },
    { str1: 'baa', str2: 'ba', expected: 1 },
    { str1: 'jeem', str2: 'jim', expected: 2 },
    { str1: 'haa', str2: 'kha', expected: 2 },
  ];
  
  tests.forEach((test, index) => {
    const distance = levenshteinDistance(test.str1, test.str2);
    const passed = distance === test.expected;
    
    console.log(`\nTest ${index + 1}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  String 1: "${test.str1}"`);
    console.log(`  String 2: "${test.str2}"`);
    console.log(`  Distance: ${distance} (Expected: ${test.expected})`);
  });
};

/**
 * Test phonetic variations database
 */
export const testPhoneticDatabase = () => {
  console.log('\n' + '='.repeat(60));
  console.log('PHONETIC DATABASE TESTS');
  console.log('='.repeat(60));
  
  const testLetters = ['أ', 'ب', 'ت', 'ج', 'ح', 'خ'];
  
  testLetters.forEach(letter => {
    const variations = getPhoneticVariations(letter);
    console.log(`\n${letter}:`);
    console.log(`  Total variations: ${variations.length}`);
    console.log(`  Variations: ${variations.join(', ')}`);
  });
};

/**
 * Performance benchmark
 */
export const benchmarkPerformance = () => {
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE BENCHMARK');
  console.log('='.repeat(60));
  
  const iterations = 1000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    analyzePronunciation('أ', 'alif');
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  console.log(`\nIterations: ${iterations}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${avgTime.toFixed(2)}ms per analysis`);
  console.log(`Target: <50ms (${avgTime < 50 ? '✓ PASS' : '✗ FAIL'})`);
};

/**
 * Run all tests
 */
export const runAllTests = () => {
  const mlResults = runMLTests();
  testLevenshtein();
  testPhoneticDatabase();
  benchmarkPerformance();
  
  console.log('\n' + '='.repeat(60));
  console.log('ALL TESTS COMPLETED');
  console.log('='.repeat(60));
  
  return mlResults;
};
