import {json} from '@shopify/remix-oxygen';

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function normalizeBoard(input) {
  if (!Array.isArray(input) || input.length !== 9) return null;

  return input.map((cell) => {
    if (cell === 'X' || cell === 'O') return cell;
    return null;
  });
}

function getWinner(board, symbol) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
      return true;
    }
  }
  return false;
}

function getAvailableMoves(board) {
  return board
    .map((cell, index) => (cell ? -1 : index))
    .filter((index) => index !== -1);
}

function getTerminalScore(board) {
  if (getWinner(board, 'O')) return 1;
  if (getWinner(board, 'X')) return -1;
  if (board.every(Boolean)) return 0;
  return null;
}

function minimax(board, isOMove, cache) {
  const terminal = getTerminalScore(board);
  if (terminal !== null) return terminal;

  const cacheKey = `${isOMove ? 'O' : 'X'}:${board
    .map((cell) => cell || '-')
    .join('')}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const available = getAvailableMoves(board);
  let bestScore = isOMove ? -Infinity : Infinity;

  for (const move of available) {
    const nextBoard = [...board];
    nextBoard[move] = isOMove ? 'O' : 'X';
    const score = minimax(nextBoard, !isOMove, cache);

    if (isOMove) {
      if (score > bestScore) bestScore = score;
    } else if (score < bestScore) {
      bestScore = score;
    }
  }

  cache.set(cacheKey, bestScore);
  return bestScore;
}

function getOptimalMove(board) {
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;

  const cache = new Map();
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of available) {
    const nextBoard = [...board];
    nextBoard[move] = 'O';
    const score = minimax(nextBoard, false, cache);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function getEngineMove(board) {
  return getOptimalMove(board);
}

function scoreOngoingMove(board, move) {
  if (!Number.isInteger(move) || move < 0 || move > 8 || board[move]) {
    return -Infinity;
  }

  const nextBoard = [...board];
  nextBoard[move] = 'O';
  const cache = new Map();
  return minimax(nextBoard, false, cache);
}

function getHeuristicMove(board) {
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;

  for (const index of available) {
    const testBoard = [...board];
    testBoard[index] = 'O';
    if (getWinner(testBoard, 'O')) return index;
  }

  for (const index of available) {
    const testBoard = [...board];
    testBoard[index] = 'X';
    if (getWinner(testBoard, 'X')) return index;
  }

  if (available.includes(4)) return 4;

  const corners = [0, 2, 6, 8].filter((index) => available.includes(index));
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

function extractOutputText(openaiJson) {
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text.trim();
  }

  const out = openaiJson?.output;
  if (!Array.isArray(out)) return '';

  let text = '';
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === 'output_text' && typeof block?.text === 'string') {
        text += block.text;
      } else if (block?.type === 'text' && typeof block?.text === 'string') {
        text += block.text;
      }
    }
  }

  return text.trim();
}

function parseJsonCandidate(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Keep trying fallbacks
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // Keep trying fallbacks
    }
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // Final fallback failed
    }
  }

  return null;
}

function parseMove(text) {
  const parsed = parseJsonCandidate(text);
  if (parsed && Number.isInteger(parsed?.move)) return parsed.move;

  const numberMatch = text.match(/-?\d+/);
  if (numberMatch) {
    const value = Number(numberMatch[0]);
    if (Number.isInteger(value)) return value;
  }

  return null;
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const body = await request.json().catch(() => ({}));
  const board = normalizeBoard(body?.board);

  if (!board) {
    return json({error: 'Invalid board payload'}, {status: 400});
  }

  const available = getAvailableMoves(board);

  if (available.length === 0) {
    return json({move: null, source: 'none'});
  }

  const fallbackMove = getEngineMove(board) ?? getHeuristicMove(board);
  const openaiKey = context.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return json({move: fallbackMove, source: 'fallback'});
  }

  const payload = {
    model: 'gpt-5-nano',
    reasoning: {effort: 'minimal'},
    instructions:
      'You are a Tic-Tac-Toe move picker for player O. Return strict JSON only.',
    input: `Game: Tic-Tac-Toe
You are player O.
Choose exactly one move index from the available moves.
Board indexes:
0|1|2
3|4|5
6|7|8
Current board JSON: ${JSON.stringify(
      board,
    )}
Available moves: ${available.join(', ')}
Output format (strict JSON only): {"move": <index>}`,
    max_output_tokens: 80,
  };

  try {
    const aiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const aiData = await aiRes.json().catch(() => null);
    if (!aiRes.ok) {
      return json({move: fallbackMove, source: 'fallback'});
    }

    const rawText = extractOutputText(aiData);
    const modelMove = parseMove(rawText);

    if (
      Number.isInteger(modelMove) &&
      modelMove >= 0 &&
      modelMove <= 8 &&
      available.includes(modelMove)
    ) {
      const modelScore = scoreOngoingMove(board, modelMove);
      const fallbackScore = scoreOngoingMove(board, fallbackMove);

      if (modelScore >= fallbackScore) {
        return json({move: modelMove, source: 'openai'});
      }
    }

    return json({move: fallbackMove, source: 'fallback'});
  } catch {
    return json({move: fallbackMove, source: 'fallback'});
  }
}
