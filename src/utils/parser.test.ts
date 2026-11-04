import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCompendiumData,
  filterPhrasalVerbs,
  calculateProgressStats,
  generateQuizQuestions,
  blankOutPhrasalVerb,
} from './parser';

test('parses all 50 Focus sections in sequential order', () => {
  const { focusSections, allVerbs } = parseCompendiumData();
  assert.equal(focusSections.length, 50, 'Should have exactly 50 Focus sections');
  assert.equal(focusSections[0].focusNumber, 1);
  assert.equal(focusSections[49].focusNumber, 50);
  assert.ok(allVerbs.length >= 390, `Expected at least 390 phrasal verbs, got ${allVerbs.length}`);

  // Verify every focus section has verbs and every verb has meanings and examples
  for (const section of focusSections) {
    assert.ok(
      section.verbs.length > 0,
      `Focus ${section.focusNumber} should contain phrasal verbs`
    );
    for (const verb of section.verbs) {
      assert.ok(
        verb.meanings.length > 0,
        `Verb ${verb.verb} in Focus ${section.focusNumber} must have at least 1 meaning`
      );
      for (const meaning of verb.meanings) {
        assert.ok(
          meaning.explanation.length > 10,
          `Meaning ${meaning.meaningNumber} of ${verb.verb} must have an explanation`
        );
        assert.ok(
          meaning.examples.length >= 2,
          `Meaning ${meaning.meaningNumber} of ${verb.verb} in Focus ${section.focusNumber} must have 2 examples`
        );
      }
    }
  }
});

test('filterPhrasalVerbs filters accurately by search query, focus, particle, and mastery', () => {
  const { allVerbs } = parseCompendiumData();

  const focus1Verbs = filterPhrasalVerbs(allVerbs, { focusNumber: 1 });
  assert.equal(focus1Verbs.length, 8);
  assert.ok(focus1Verbs.some((v) => v.verb === 'PUT ON'));

  const putOnSearch = filterPhrasalVerbs(allVerbs, { searchQuery: 'put on' });
  assert.ok(putOnSearch.some((v) => v.verb === 'PUT ON'));

  const masteryMap = { [focus1Verbs[0].id]: 'mastered' as const };
  const masteredOnly = filterPhrasalVerbs(allVerbs, {
    masteryFilter: 'mastered',
    masteryMap,
  });
  assert.equal(masteredOnly.length, 1);
  assert.equal(masteredOnly[0].id, focus1Verbs[0].id);
});

test('calculateProgressStats computes accurate totals and percentages', () => {
  const { allVerbs } = parseCompendiumData();
  const masteryMap = {
    [allVerbs[0].id]: 'mastered' as const,
    [allVerbs[1].id]: 'learning' as const,
  };
  const bookmarks = [allVerbs[0].id, allVerbs[2].id];
  const stats = calculateProgressStats(allVerbs, masteryMap, bookmarks);

  assert.equal(stats.totalVerbs, allVerbs.length);
  assert.equal(stats.masteredCount, 1);
  assert.equal(stats.learningCount, 1);
  assert.equal(stats.bookmarkedCount, 2);
  assert.ok(stats.totalMeanings > stats.totalVerbs);
  assert.ok(stats.totalExamples >= stats.totalMeanings * 2);
});

test('blankOutPhrasalVerb and generateQuizQuestions produce valid questions', () => {
  const blanked = blankOutPhrasalVerb(
    'Our plane took off an hour late because of the snow.',
    'TAKE OFF'
  );
  assert.ok(blanked.includes('________'));

  const { allVerbs } = parseCompendiumData();
  const questions = generateQuizQuestions(allVerbs.slice(0, 20), 10);
  assert.equal(questions.length, 10);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.includes(q.correctAnswer));
  }
});
