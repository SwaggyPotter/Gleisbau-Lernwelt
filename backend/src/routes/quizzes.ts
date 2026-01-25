import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

type QuizQuestion = { id: string; prompt: string; choices: string[]; correctIndex: number };

// Sample questions per Lernfeld
const quizBank: Record<string, QuizQuestion[]> = {
  'lf-01': [
    {
      id: 'lf01-q1',
      prompt: 'Wer traegt die Verantwortung fuer die Sicherung einer Baustelle im Gleisbau?',
      choices: ['Bauleiter', 'Sicherheitsbeauftragter', 'Jeder Mitarbeitende', 'Der Azubi'],
      correctIndex: 2,
    },
    {
      id: 'lf01-q2',
      prompt: 'Welche PSA ist beim Arbeiten im Gleisbereich Pflicht?',
      choices: ['Warnweste, Sicherheitsschuhe, Helm', 'Nur Handschuhe', 'Schutzbrille reicht', 'Keine, wenn die Strecke gesperrt ist'],
      correctIndex: 0,
    },
    {
      id: 'lf01-q3',
      prompt: 'Was ist der erste Schritt beim Einrichten einer Baustelle?',
      choices: ['Material bestellen', 'Verkehrs- und Gefahrenbereich absichern', 'Bauwagen aufstellen', 'Werkzeuge verteilen'],
      correctIndex: 1,
    },
  ],
};

const startSchema = z.object({
  fieldId: z.string().min(1),
  userId: z.string().uuid().optional(),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  choiceIndex: z.number().int().min(0),
});

export const quizzesRouter = Router();

quizzesRouter.post('/start', asyncHandler(async (req, res) => {
  const { fieldId, userId } = startSchema.parse(req.body);
  const questions = quizBank[fieldId];
  if (!questions) {
    throw httpError(404, 'Für dieses Lernfeld ist noch kein Quiz hinterlegt');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      `SELECT id, field_id, current_index, is_complete FROM quiz_sessions
       WHERE field_id = $1 AND (user_id IS NOT DISTINCT FROM $2) AND is_complete = false
       ORDER BY updated_at DESC LIMIT 1`,
      [fieldId, userId ?? null],
    );

    let sessionId: string;
    if (existing.length) {
      sessionId = existing[0].id;
    } else {
      const { rows: created } = await client.query(
        `INSERT INTO quiz_sessions (field_id, user_id)
         VALUES ($1, $2)
         RETURNING id, current_index, is_complete`,
        [fieldId, userId ?? null],
      );
      sessionId = created[0].id;
    }

    const { rows: answers } = await client.query(
      'SELECT question_id, choice_index FROM quiz_answers WHERE session_id = $1',
      [sessionId],
    );
    const answerMap = Object.fromEntries(answers.map(a => [a.question_id, a.choice_index]));
    const currentIndex = Math.min(
      questions.length - 1,
      Math.max(0, questions.findIndex(q => answerMap[q.id] === undefined)),
    );

    await client.query('UPDATE quiz_sessions SET current_index = $1, updated_at = now() WHERE id = $2', [currentIndex, sessionId]);
    await client.query('COMMIT');

    res.json({
      session: {
        id: sessionId,
        fieldId,
        currentIndex,
        isComplete: existing[0]?.is_complete ?? false,
        questions: questions.map(({ correctIndex, ...rest }) => rest),
        answers: answerMap,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

quizzesRouter.post('/:id/answer', asyncHandler(async (req, res) => {
  const sessionId = z.string().uuid().parse(req.params.id);
  const { questionId, choiceIndex } = answerSchema.parse(req.body);

  const { rows: sessionRows } = await pool.query(
    'SELECT field_id, is_complete FROM quiz_sessions WHERE id = $1',
    [sessionId],
  );
  if (!sessionRows.length) throw httpError(404, 'Quiz-Session nicht gefunden');
  if (sessionRows[0].is_complete) throw httpError(409, 'Quiz bereits abgeschlossen');

  const questions = quizBank[sessionRows[0].field_id];
  const question = questions?.find(q => q.id === questionId);
  if (!question) throw httpError(404, 'Frage nicht gefunden');
  if (choiceIndex < 0 || choiceIndex >= question.choices.length) throw httpError(400, 'Antwort ungültig');

  const isCorrect = choiceIndex === question.correctIndex;

  await pool.query(
    `INSERT INTO quiz_answers (session_id, question_id, choice_index, is_correct)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_id, question_id)
     DO UPDATE SET choice_index = EXCLUDED.choice_index, is_correct = EXCLUDED.is_correct, answered_at = now()`,
    [sessionId, questionId, choiceIndex, isCorrect],
  );

  // update current_index to next unanswered
  const { rows: answers } = await pool.query(
    'SELECT question_id FROM quiz_answers WHERE session_id = $1',
    [sessionId],
  );
  const answeredIds = new Set(answers.map(a => a.question_id));
  let currentIndex = 0;
  if (questions) {
    const firstUnanswered = questions.findIndex(q => !answeredIds.has(q.id));
    currentIndex = firstUnanswered >= 0 ? firstUnanswered : questions.length - 1;
  }

  await pool.query(
    'UPDATE quiz_sessions SET current_index = $1, updated_at = now() WHERE id = $2',
    [currentIndex, sessionId],
  );

  res.json({
    progress: {
      answered: answeredIds.size,
      total: questions?.length ?? 0,
      currentIndex,
    },
  });
}));

quizzesRouter.post('/:id/complete', asyncHandler(async (req, res) => {
  const sessionId = z.string().uuid().parse(req.params.id);
  await pool.query('UPDATE quiz_sessions SET is_complete = true, updated_at = now() WHERE id = $1', [sessionId]);
  res.status(204).send();
}));

quizzesRouter.get('/:id/results', asyncHandler(async (req, res) => {
  const sessionId = z.string().uuid().parse(req.params.id);
  const { rows: sessionRows } = await pool.query(
    'SELECT field_id FROM quiz_sessions WHERE id = $1',
    [sessionId],
  );
  if (!sessionRows.length) throw httpError(404, 'Quiz-Session nicht gefunden');
  const fieldId = sessionRows[0].field_id;
  const questions = quizBank[fieldId];
  if (!questions) throw httpError(404, 'Fragen nicht gefunden');

  const { rows: answers } = await pool.query(
    'SELECT question_id, choice_index, is_correct FROM quiz_answers WHERE session_id = $1',
    [sessionId],
  );
  const answerMap = Object.fromEntries(answers.map(a => [a.question_id, { choiceIndex: a.choice_index, isCorrect: a.is_correct }]));

  const resultQuestions = questions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    selectedIndex: answerMap[q.id]?.choiceIndex ?? null,
    isCorrect: answerMap[q.id]?.isCorrect ?? false,
  }));

  const correctCount = resultQuestions.filter(q => q.isCorrect).length;

  res.json({
    results: {
      total: questions.length,
      correct: correctCount,
      questions: resultQuestions,
    },
  });
}));
