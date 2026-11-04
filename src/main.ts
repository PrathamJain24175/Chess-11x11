import './style.css';

type Side = 'white' | 'black';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'A' | 'G' | 'P';

type Piece = {
  side: Side;
  type: PieceType;
  moved: boolean;
};
type CapturedPiece = {
  side: Side;
  type: PieceType;
};
const files = 'ABCDEFGHIJK'.split('');
const pieces: Record<string, Piece> = {};

const backRank: PieceType[] = [
  'R',
  'R',
  'B',
  'A',
  'G',
  'K',
  'G',
  'A',
  'B',
  'R',
  'R',
];
const secondRank: PieceType[] = [
  'N',
  'N',
  'B',
  'G',
  'A',
  'Q',
  'A',
  'G',
  'B',
  'N',
  'N',
];

function promoteGuardian(piece: Piece, side: Side) {
  const choice = (
    prompt(
      `${side.toUpperCase()} Guardian completed its journey! Choose promotion: Q, R, B, N, A or G`,
      'Q'
    ) || 'Q'
  )
    .trim()
    .toUpperCase();

  const validChoices: PieceType[] = ['Q', 'R', 'B', 'N', 'A', 'G'];

  piece.type = validChoices.includes(choice as PieceType)
    ? (choice as PieceType)
    : 'Q';

  if (side === 'white') {
    whitePrivilegedGuardian = null;
    whiteGuardianCurrentSquare = null;
    whiteGuardianReachedEnd = false;
  } else {
    blackPrivilegedGuardian = null;
    blackGuardianCurrentSquare = null;
    blackGuardianReachedEnd = false;
  }
}

function reassignPrivilegedGuardian(side: Side) {
  const guardianSquares =
    side === 'white' ? ['E1', 'G1', 'D2', 'H2'] : ['E11', 'G11', 'D10', 'H10'];

  // Only Guardians still on their original squares qualify
  const availableGuardians = guardianSquares.filter(
    (square) => pieces[square]?.type === 'G' && pieces[square]?.side === side
  );

  if (availableGuardians.length === 0) {
    if (side === 'white') {
      whitePrivilegedGuardian = null;
      whiteGuardianCurrentSquare = null;
      whiteGuardianReachedEnd = false;
    } else {
      blackPrivilegedGuardian = null;
      blackGuardianCurrentSquare = null;
      blackGuardianReachedEnd = false;
    }

    return;
  }

  const choice = prompt(
    `${side.toUpperCase()}'s privileged Guardian was captured!\nChoose a replacement:\n${availableGuardians.join(
      ', '
    )}`,
    availableGuardians[0]
  );

  const selectedSquare = (choice || availableGuardians[0]).trim().toUpperCase();

  const newGuardian = availableGuardians.includes(selectedSquare)
    ? selectedSquare
    : availableGuardians[0];

  if (side === 'white') {
    whitePrivilegedGuardian = newGuardian;
    whiteGuardianCurrentSquare = newGuardian;
    whiteGuardianReachedEnd = false;
  } else {
    blackPrivilegedGuardian = newGuardian;
    blackGuardianCurrentSquare = newGuardian;
    blackGuardianReachedEnd = false;
  }
}

function place(file: string, rank: number, side: Side, type: PieceType) {
  pieces[`${file}${rank}`] = { side, type, moved: false };
}

function initializePieces() {
  // Remove all existing pieces
  Object.keys(pieces).forEach((square) => delete pieces[square]);

  // Place all pieces in their original positions
  files.forEach((file, i) => {
    place(file, 1, 'white', backRank[i]);
    place(file, 2, 'white', secondRank[i]);
    place(file, 3, 'white', 'P');

    place(file, 11, 'black', backRank[i]);
    place(file, 10, 'black', secondRank[i]);
    place(file, 9, 'black', 'P');
  });
}

// Initialize pieces when the game first loads
initializePieces();

function selectPrivilegedGuardians() {
  const whiteChoice = (
    prompt('WHITE: Choose your privileged Guardian (E1, G1, D2, H2)', 'E1') ||
    'E1'
  )
    .trim()
    .toUpperCase();

  whitePrivilegedGuardian = ['E1', 'G1', 'D2', 'H2'].includes(whiteChoice)
    ? whiteChoice
    : 'E1';

  whiteGuardianCurrentSquare = whitePrivilegedGuardian;

  const blackChoice = (
    prompt(
      'BLACK: Choose your privileged Guardian (E11, G11, D10, H10)',
      'E11'
    ) || 'E11'
  )
    .trim()
    .toUpperCase();

  blackPrivilegedGuardian = ['E11', 'G11', 'D10', 'H10'].includes(blackChoice)
    ? blackChoice
    : 'E11';

  blackGuardianCurrentSquare = blackPrivilegedGuardian;
}

const symbols: Record<PieceType, string> = {
  K: '♚',
  Q: '♛',
  R: '♜',
  B: '♝',
  N: '♞',
  A: 'A',
  G: 'G',
  P: '♟',
};

let turn: Side = 'white';
let gameOver = false;
let gamePaused = false;
const playerNames: Record<Side, string> = {
  white: 'White',
  black: 'Black',
};

function getPlayerName(side: Side): string {
  return playerNames[side];
}
let positionCounts = new Map<string, number>();
let capturedPieces: CapturedPiece[] = [];
let capturedPiecesVisible = false;
let whitePrivilegedGuardian: string | null = null;
let blackPrivilegedGuardian: string | null = null;

let whiteGuardianReachedEnd = false;
let blackGuardianReachedEnd = false;
let whiteGuardianCurrentSquare: string | null = null;
let blackGuardianCurrentSquare: string | null = null;
let enPassantTarget: string | null = null;
let enPassantPawnSquare: string | null = null;
let selected: string | null = null;
let legalTargets: string[] = [];

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) throw new Error('App container not found');

app.innerHTML = `
  <main class="game">
    <header class="game-header">
      <div>
        <p class="eyebrow">CUSTOM CHESS PROJECT</p>
        <h1>ELEVEN <span>×</span> ELEVEN</h1>
        <p class="subtitle">A new dimension of chess</p>
      </div>
      <div class="game-info">
        <span class="turn-dot"></span>
        <span id="turn-label">White to move</span>
      </div>
    </header>

    <section class="game-layout">
      <div class="board-panel">
      <div class="board-heading">
      <span>THE BATTLEFIELD</span>
      <span>11 × 11 BOARD</span>
    </div>
    
    <!-- Captured White pieces: Black's side -->
    <div
      id="captured-white-display"
      style="display: none; align-items: center; gap: 6px; flex-wrap: wrap; min-height: 24px;"
    ></div>
    
    <div class="board-frame">
          <div class="rank-labels" id="rank-labels"></div>
          <div class="board-area">
            <div class="chess-board" id="chess-board"></div>
            <div class="file-labels" id="file-labels"></div>
          </div>
          </div>

          <!-- Captured Black pieces: White's side -->
          <div
            id="captured-black-display"
            style="display: none; align-items: center; gap: 6px; flex-wrap: wrap; min-height: 24px;"
          ></div>
        </div>
  
        <aside class="side-panel">
        <h2>Game overview</h2>
        <div class="info-card">
  <span class="info-label">PLAYERS</span>
  <strong>
    <span id="white-player-name">White</span>
    vs
    <span id="black-player-name">Black</span>
  </strong>
</div>

<button id="edit-player-names-button" type="button">
  Edit Player Names
</button>
        <div class="info-card">
          <span class="info-label">TOTAL PIECES</span>
          <strong id="piece-count">66 Pieces</strong>
        </div>
        <div class="info-card">
          <span class="info-label">PLAYERS</span>
          <strong>White vs Black</strong>
        </div>
        <div class="legend">
          <h3>Special pieces</h3>
          <p><span class="legend-piece">A</span> Archer</p>
          <p><span class="legend-piece">G</span> Guardian</p>
        </div>
        <p class="coming-soon" id="game-message">White begins. Select a piece.</p>
        <button id="claim-draw-button" type="button" style="display: none;">
  Claim Threefold Draw
</button>
<button id="new-game-button" type="button">
  New Game
</button>
<button id="captured-pieces-button" type="button">
  Captured Pieces
</button>
<button id="exit-button" type="button">
  Exit
</button>
      </aside>
      </section>

      <!-- Pause Screen -->
      <div
        id="pause-screen"
        style="
          display: none;
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.85);
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: white;
          text-align: center;
        "
      >
        <h1>GAME PAUSED</h1>
        <p>Your game is safe. Continue whenever you are ready.</p>
        <button id="continue-game-button" type="button">
          Continue Game
        </button>
      </div>
  
      <footer>PROJECT VERSION 1.1 · BASIC MOVEMENT</footer>
  </main>
`;

const board = document.querySelector<HTMLDivElement>('#chess-board')!;
const turnLabel = document.querySelector<HTMLSpanElement>('#turn-label')!;
const gameMessage =
  document.querySelector<HTMLParagraphElement>('#game-message')!;
const claimDrawButton =
  document.querySelector<HTMLButtonElement>('#claim-draw-button')!;
const newGameButton =
  document.querySelector<HTMLButtonElement>('#new-game-button')!;
const capturedPiecesButton = document.querySelector<HTMLButtonElement>(
  '#captured-pieces-button'
)!;
const exitButton = document.querySelector<HTMLButtonElement>('#exit-button')!;

const pauseScreen = document.querySelector<HTMLDivElement>('#pause-screen')!;

const continueGameButton = document.querySelector<HTMLButtonElement>(
  '#continue-game-button'
)!;

const capturedWhiteDisplay = document.querySelector<HTMLDivElement>(
  '#captured-white-display'
)!;

const capturedBlackDisplay = document.querySelector<HTMLDivElement>(
  '#captured-black-display'
)!;
const pieceCount = document.querySelector<HTMLSpanElement>('#piece-count')!;
const whitePlayerNameDisplay =
  document.querySelector<HTMLSpanElement>('#white-player-name')!;

const blackPlayerNameDisplay =
  document.querySelector<HTMLSpanElement>('#black-player-name')!;

const editPlayerNamesButton = document.querySelector<HTMLButtonElement>(
  '#edit-player-names-button'
)!;
const rankLabels = document.querySelector<HTMLDivElement>('#rank-labels')!;
for (let rank = 11; rank >= 1; rank--) {
  const label = document.createElement('span');
  label.textContent = String(rank);
  rankLabels.appendChild(label);
}

const fileLabels = document.querySelector<HTMLDivElement>('#file-labels')!;
files.forEach((file) => {
  const label = document.createElement('span');
  label.textContent = file;
  fileLabels.appendChild(label);
});

function coordinates(square: string) {
  return {
    x: files.indexOf(square[0]),
    y: Number(square.slice(1)),
  };
}

function squareName(x: number, y: number) {
  if (x < 0 || x > 10 || y < 1 || y > 11) return null;
  return `${files[x]}${y}`;
}

function pathIsClear(from: string, to: string) {
  const a = coordinates(from);
  const b = coordinates(to);
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);

  let x = a.x + dx;
  let y = a.y + dy;

  while (x !== b.x || y !== b.y) {
    const square = squareName(x, y);
    if (!square || pieces[square]) return false;
    x += dx;
    y += dy;
  }

  return true;
}

function canLand(from: string, to: string, side: Side) {
  if (!to || to === from) return false;
  return !pieces[to] || pieces[to].side !== side;
}

function getPseudoMoves(from: string): string[] {
  const piece = pieces[from];
  if (!piece) return [];

  const { x, y } = coordinates(from);
  const moves: string[] = [];

  function addRay(dx: number, dy: number) {
    let nx = x + dx;
    let ny = y + dy;

    while (true) {
      const target = squareName(nx, ny);
      if (!target) break;

      if (pieces[target]) {
        if (pieces[target].side !== piece.side) moves.push(target);
        break;
      }

      moves.push(target);
      nx += dx;
      ny += dy;
    }
  }

  function addStep(dx: number, dy: number) {
    const target = squareName(x + dx, y + dy);
    if (target && canLand(from, target, piece.side)) moves.push(target);
  }

  const straight = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const diagonal = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  const allDirections = [...straight, ...diagonal];

  switch (piece.type) {
    case 'R':
      straight.forEach(([dx, dy]) => addRay(dx, dy));
      break;

    case 'B':
      diagonal.forEach(([dx, dy]) => addRay(dx, dy));
      break;

    case 'Q':
      allDirections.forEach(([dx, dy]) => addRay(dx, dy));
      break;

    case 'K':
      allDirections.forEach(([dx, dy]) => addStep(dx, dy));
      moves.push(...getCastlingMoves(from));
      break;

    case 'G':
      allDirections.forEach(([dx, dy]) => {
        addStep(dx, dy);
        const middle = squareName(x + dx, y + dy);
        const target = squareName(x + 2 * dx, y + 2 * dy);
        if (
          middle &&
          !pieces[middle] &&
          target &&
          canLand(from, target, piece.side)
        ) {
          moves.push(target);
        }
      });
      break;

    case 'N': {
      const jumps = [
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2],
      ];
      jumps.forEach(([dx, dy]) => addStep(dx, dy));
      break;
    }

    case 'A':
      diagonal.forEach(([dx, dy]) => addRay(dx, dy));
      straight.forEach(([dx, dy]) => {
        const middle = squareName(x + dx, y + dy);
        const target = squareName(x + 2 * dx, y + 2 * dy);
        if (
          middle &&
          !pieces[middle] &&
          target &&
          canLand(from, target, piece.side)
        ) {
          moves.push(target);
        }
      });
      break;

    case 'P': {
      const direction = piece.side === 'white' ? 1 : -1;
      const oneStep = squareName(x, y + direction);

      if (oneStep && !pieces[oneStep]) {
        moves.push(oneStep);

        const startingRank = piece.side === 'white' ? 3 : 9;
        const twoStep = squareName(x, y + 2 * direction);

        if (!piece.moved && y === startingRank && twoStep && !pieces[twoStep]) {
          moves.push(twoStep);
        }
      }

      for (const dx of [-1, 1]) {
        const target = squareName(x + dx, y + direction);

        if (target && pieces[target] && pieces[target].side !== piece.side) {
          moves.push(target);
        }

        // En passant
        if (
          target &&
          target === enPassantTarget &&
          enPassantPawnSquare &&
          pieces[enPassantPawnSquare]?.type === 'P' &&
          pieces[enPassantPawnSquare]?.side !== piece.side
        ) {
          moves.push(target);
        }
      }

      break;
    }
  }

  return moves;
}

// CHECK WHETHER A PIECE ATTACKS A PARTICULAR SQUARE

function pieceAttacksSquare(
  from: string,
  target: string,
  piece: Piece
): boolean {
  const a = coordinates(from);
  const b = coordinates(target);

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (dx === 0 && dy === 0) return false;

  if (piece.type === 'P') {
    const direction = piece.side === 'white' ? 1 : -1;
    return ay === 1 && dy === direction && ax === 1;
  }

  if (piece.type === 'N') {
    return (ax === 1 && ay === 2) || (ax === 2 && ay === 1);
  }

  if (piece.type === 'K') {
    return ax <= 1 && ay <= 1;
  }

  if (piece.type === 'G') {
    if (ax <= 1 && ay <= 1) return true;

    if (ax <= 2 && ay <= 2 && (ax === 2 || ay === 2)) {
      const middle = squareName(a.x + Math.sign(dx), a.y + Math.sign(dy));
      return !!middle && !pieces[middle];
    }

    return false;
  }

  const straight = dx === 0 || dy === 0;
  const diagonal = ax === ay;

  if (piece.type === 'R' && !straight) return false;
  if (piece.type === 'B' && !diagonal) return false;
  if (
    piece.type === 'A' &&
    !diagonal &&
    !((ax === 2 && dy === 0) || (ay === 2 && dx === 0))
  ) {
    return false;
  }

  if (piece.type === 'Q' && !straight && !diagonal) return false;

  if (piece.type === 'A' && straight && (ax === 2 || ay === 2)) {
    const middle = squareName(a.x + Math.sign(dx), a.y + Math.sign(dy));
    return !!middle && !pieces[middle];
  }

  if (
    piece.type === 'R' ||
    piece.type === 'B' ||
    piece.type === 'Q' ||
    piece.type === 'A'
  ) {
    if (!straight && !diagonal) return false;
    return pathIsClear(from, target);
  }

  return false;
}

// CHECK WHETHER A SQUARE IS UNDER ATTACK

function isSquareAttacked(target: string, bySide: Side): boolean {
  for (const from of Object.keys(pieces)) {
    const piece = pieces[from];

    if (piece.side === bySide && pieceAttacksSquare(from, target, piece)) {
      return true;
    }
  }

  return false;
}

// FIND A PLAYER'S KING

function findKing(side: Side): string | null {
  for (const square of Object.keys(pieces)) {
    if (pieces[square].side === side && pieces[square].type === 'K') {
      return square;
    }
  }

  return null;
}

// CHECK WHETHER A PLAYER'S KING IS UNDER ATTACK

function isInCheck(side: Side): boolean {
  const kingSquare = findKing(side);

  if (!kingSquare) return true;

  const opponent: Side = side === 'white' ? 'black' : 'white';

  return isSquareAttacked(kingSquare, opponent);
}

// FILTER OUT MOVES THAT EXPOSE THE MOVING PLAYER'S KING

function getCastlingMoves(from: string): string[] {
  const king = pieces[from];

  if (!king || king.type !== 'K' || king.moved) return [];
  if (isInCheck(king.side)) return [];

  const rank = king.side === 'white' ? 1 : 11;
  const files = 'ABCDEFGHIJK';
  const kingFile = files.indexOf(from[0]);

  const destinations: string[] = [];

  for (const direction of [-1, 1]) {
    for (let distance = 1; distance <= 5; distance++) {
      const rookFile = kingFile + direction * distance;

      if (rookFile < 0 || rookFile >= 11) break;

      const rookSquare = `${files[rookFile]}${rank}`;
      const rook = pieces[rookSquare];

      if (!rook) continue;

      if (rook.side !== king.side || rook.type !== 'R') {
        break;
      }

      if (rook.moved) continue;

      const kingDestinationFile = kingFile + direction * 2;

      if (kingDestinationFile < 0 || kingDestinationFile >= 11) break;

      const destination = `${files[kingDestinationFile]}${rank}`;

      let pathClear = true;

      for (
        let file = kingFile + direction;
        file !== rookFile;
        file += direction
      ) {
        if (pieces[`${files[file]}${rank}`]) {
          pathClear = false;
          break;
        }
      }

      if (!pathClear) continue;

      let kingPathSafe = true;

      for (let step = 1; step <= 2; step++) {
        const testSquare = `${files[kingFile + direction * step]}${rank}`;

        const originalKing = pieces[from];

        delete pieces[from];
        pieces[testSquare] = originalKing;

        const attacked = isSquareAttacked(
          testSquare,
          king.side === 'white' ? 'black' : 'white'
        );

        delete pieces[testSquare];
        pieces[from] = originalKing;

        if (attacked) {
          kingPathSafe = false;
          break;
        }
      }

      if (kingPathSafe) {
        destinations.push(destination);
        break;
      }
    }
  }

  return destinations;
}

function getMoves(from: string): string[] {
  const piece = pieces[from];

  if (!piece) return [];

  const candidates = getPseudoMoves(from);
  const legalMoves: string[] = [];

  for (const target of candidates) {
    // A King must never be captured directly.
    if (pieces[target]?.type === 'K') continue;

    const movingPiece = pieces[from];
    const capturedPiece = pieces[target];

    if (!movingPiece) continue;

    // Detect En passant capture.
    const isEnPassant =
      movingPiece.type === 'P' &&
      target === enPassantTarget &&
      !capturedPiece &&
      enPassantPawnSquare !== null;

    const enPassantCapturedPiece = isEnPassant
      ? pieces[enPassantPawnSquare!]
      : undefined;

    // Temporarily move the piece.
    delete pieces[from];
    pieces[target] = movingPiece;

    // Temporarily remove the En passant Pawn.
    if (isEnPassant && enPassantPawnSquare) {
      delete pieces[enPassantPawnSquare];
    }

    const kingIsSafe = !isInCheck(movingPiece.side);

    // Restore the original position.
    delete pieces[target];
    pieces[from] = movingPiece;

    if (capturedPiece) {
      pieces[target] = capturedPiece;
    }

    if (isEnPassant && enPassantPawnSquare && enPassantCapturedPiece) {
      pieces[enPassantPawnSquare] = enPassantCapturedPiece;
    }

    if (kingIsSafe) {
      legalMoves.push(target);
    }
  }

  return legalMoves;
}
function hasAnyLegalMove(side: Side): boolean {
  for (const square of Object.keys(pieces)) {
    const piece = pieces[square];

    if (piece.side === side) {
      const moves = getMoves(square);

      if (moves.length > 0) {
        return true;
      }
    }
  }

  return false;
}
function isInsufficientMaterial(): boolean {
  const remainingPieces = Object.values(pieces);

  const kingCount = remainingPieces.filter(
    (piece) => piece.type === 'K'
  ).length;

  return remainingPieces.length === 2 && kingCount === 2;
}
function getPositionKey(): string {
  const boardState = Object.keys(pieces)
    .sort()
    .map((square) => {
      const piece = pieces[square];

      const movedState = ['P', 'K', 'R'].includes(piece.type)
        ? piece.moved
          ? '1'
          : '0'
        : '';

      return `${square}:${piece.side}:${piece.type}:${movedState}`;
    })
    .join('|');

  let enPassantState = '-';

  if (enPassantTarget && enPassantPawnSquare) {
    const canCaptureEnPassant = Object.keys(pieces).some((square) => {
      const piece = pieces[square];

      return (
        piece.side === turn &&
        piece.type === 'P' &&
        getMoves(square).includes(enPassantTarget!)
      );
    });

    if (canCaptureEnPassant) {
      enPassantState = `${enPassantTarget}:${enPassantPawnSquare}`;
    }
  }

  const guardianState = [
    whitePrivilegedGuardian ?? '-',
    whiteGuardianCurrentSquare ?? '-',
    whiteGuardianReachedEnd ? '1' : '0',
    blackPrivilegedGuardian ?? '-',
    blackGuardianCurrentSquare ?? '-',
    blackGuardianReachedEnd ? '1' : '0',
  ].join(':');

  return `${turn}||${boardState}||EP:${enPassantState}||G:${guardianState}`;
}

function recordCurrentPosition(): void {
  const key = getPositionKey();
  const count = positionCounts.get(key) ?? 0;

  positionCounts.set(key, count + 1);
}
function startNewGame() {
  // Restore all pieces to their starting positions
  initializePieces();

  // Reset the game status
  turn = 'white';
  gameOver = false;
  gamePaused = false;
  pauseScreen.style.display = 'none';

  // Reset repetition history
  positionCounts = new Map<string, number>();
  // Clear captured pieces
  capturedPieces = [];
  capturedPiecesVisible = false;
  // Reset Guardian promotion state
  whitePrivilegedGuardian = null;
  blackPrivilegedGuardian = null;
  whiteGuardianReachedEnd = false;
  blackGuardianReachedEnd = false;
  whiteGuardianCurrentSquare = null;
  blackGuardianCurrentSquare = null;

  // Reset en passant
  enPassantTarget = null;
  enPassantPawnSquare = null;

  // Clear any selected piece
  selected = null;
  legalTargets = [];

  // Reset the game message
  gameMessage.textContent = `${getPlayerName('white')} begins. Select a piece.`;

  // Select the privileged Guardians again
  selectPrivilegedGuardians();

  // Record the new starting position
  recordCurrentPosition();

  // Refresh the board
  renderBoard();
}
function getLegalBonusPawnTargets(side: Side): string[] {
  const opponent: Side = side === 'white' ? 'black' : 'white';

  const legalTargets: string[] = [];

  for (const square of Object.keys(pieces)) {
    const piece = pieces[square];

    // Only opposing Pawns can be captured
    if (piece.type !== 'P' || piece.side !== opponent) {
      continue;
    }

    // Temporarily remove the Pawn
    delete pieces[square];

    // Check whether our King remains safe
    const kingIsSafe = !isInCheck(side);

    // Restore the Pawn
    pieces[square] = piece;

    if (kingIsSafe) {
      legalTargets.push(square);
    }
  }

  return legalTargets;
}

function offerSpecialSquareBonusCapture(side: Side) {
  const availableTargets = getLegalBonusPawnTargets(side);

  if (availableTargets.length === 0) {
    gameMessage.textContent = 'No legal bonus Pawn capture available.';

    return;
  }

  let choice = prompt(
    `${side.toUpperCase()} BONUS CAPTURE!\nChoose an opponent Pawn to remove:\n${availableTargets.join(
      ', '
    )}\n\nCancel to skip.`,
    availableTargets[0]
  );

  while (
    choice !== null &&
    !availableTargets.includes(choice.trim().toUpperCase())
  ) {
    choice = prompt(
      `Invalid square!\nChoose one of: ${availableTargets.join(', ')}`,
      availableTargets[0]
    );
  }

  if (choice !== null) {
    const selectedSquare = choice.trim().toUpperCase();
    const bonusCapturedPiece = pieces[selectedSquare];

    if (bonusCapturedPiece) {
      capturedPieces.push({
        side: bonusCapturedPiece.side,
        type: bonusCapturedPiece.type,
      });
    }

    delete pieces[selectedSquare];

    gameMessage.textContent = `BONUS! Pawn captured at ${selectedSquare}.`;
  }
}

function renderBoard() {
  board.innerHTML = '';

  for (let rank = 11; rank >= 1; rank--) {
    files.forEach((file, fileIndex) => {
      const name = `${file}${rank}`;
      const square = document.createElement('div');
      const isLight = (fileIndex + rank) % 2 === 0;

      const specialSquares = ['A1', 'A6', 'K6', 'K11'];

      square.className = `square ${isLight ? 'light' : 'dark'}`;

      if (specialSquares.includes(name)) {
        square.classList.add('special-square');
      }
      square.dataset.square = name;

      if (name === selected) square.classList.add('selected');
      const kingSquare = findKing(turn);

      if (kingSquare === name && isInCheck(turn)) {
        square.classList.add('king-in-check');
      }
      if (legalTargets.includes(name)) {
        square.classList.add(pieces[name] ? 'capture-target' : 'move-target');
      }

      const piece = pieces[name];
      if (piece) {
        const element = document.createElement('span');
        element.className = `piece ${piece.side} piece-${piece.type} ${
          piece.side === turn ? 'active-player-piece' : 'inactive-player-piece'
        }`;
        element.textContent = symbols[piece.type];
        element.title = `${piece.side} ${piece.type} at ${name}`;
        square.appendChild(element);
      }

      square.addEventListener('click', () => handleSquareClick(name));
      board.appendChild(square);
    });
  }

  turnLabel.textContent = `${getPlayerName(turn)} to move`;
  pieceCount.textContent = `${Object.keys(pieces).length} Pieces`;
  renderCapturedPieces();
  const currentKey = getPositionKey();
  const currentCount = positionCounts.get(currentKey) ?? 0;

  claimDrawButton.style.display =
    !gameOver && currentCount >= 3 ? 'block' : 'none';
}
function renderCapturedPieces() {
  // Show or hide the captured-piece rows
  capturedWhiteDisplay.style.display = capturedPiecesVisible ? 'flex' : 'none';

  capturedBlackDisplay.style.display = capturedPiecesVisible ? 'flex' : 'none';

  // Clear previous display
  capturedWhiteDisplay.innerHTML = '';
  capturedBlackDisplay.innerHTML = '';

  // Add labels
  const whiteLabel = document.createElement('span');
  whiteLabel.textContent = "Black's side — captured White:";
  capturedWhiteDisplay.appendChild(whiteLabel);

  const blackLabel = document.createElement('span');
  blackLabel.textContent = "White's side — captured Black:";
  capturedBlackDisplay.appendChild(blackLabel);

  // Display captured pieces in their respective rows
  capturedPieces.forEach((piece) => {
    const element = document.createElement('span');

    element.className = `captured-piece ${piece.side}`;
    element.textContent = symbols[piece.type];
    element.title = `Captured ${piece.side} ${piece.type}`;

    element.style.fontSize = '16px';
    element.style.lineHeight = '1';
    element.style.padding = '2px';

    if (piece.side === 'white') {
      capturedWhiteDisplay.appendChild(element);
    } else {
      capturedBlackDisplay.appendChild(element);
    }
  });
}

function handleSquareClick(target: string) {
  if (gameOver || gamePaused) return;

  const clickedPiece = pieces[target];

  if (selected && legalTargets.includes(target)) {
    const movingPiece = pieces[selected];

    if (movingPiece) {
      const previousTurn = turn;

      const from = selected;
      const kingMove = movingPiece.type === 'K';
      // Check whether the destination contains a privileged Guardian
      const capturedPiece = pieces[target];
      // Check whether a capture happened on a special square
      const isSpecialSquareCapture =
        !!capturedPiece &&
        capturedPiece.side !== movingPiece.side &&
        ['A1', 'A6', 'K6', 'K11'].includes(target);

      const capturedWhitePrivilegedGuardian =
        capturedPiece?.type === 'G' &&
        capturedPiece.side === 'white' &&
        target === whiteGuardianCurrentSquare;

      const capturedBlackPrivilegedGuardian =
        capturedPiece?.type === 'G' &&
        capturedPiece.side === 'black' &&
        target === blackGuardianCurrentSquare;

      // Identify the privileged Guardian
      const isWhitePrivilegedGuardian =
        movingPiece.type === 'G' &&
        movingPiece.side === 'white' &&
        from === whiteGuardianCurrentSquare;

      const isBlackPrivilegedGuardian =
        movingPiece.type === 'G' &&
        movingPiece.side === 'black' &&
        from === blackGuardianCurrentSquare;

      // En passant detection
      const isEnPassantCapture =
        movingPiece.type === 'P' &&
        target === enPassantTarget &&
        !pieces[target] &&
        enPassantPawnSquare !== null;
      // Record a normal capture
      if (capturedPiece && capturedPiece.side !== movingPiece.side) {
        capturedPieces.push({
          side: capturedPiece.side,
          type: capturedPiece.type,
        });
      }

      // Record an En passant capture
      if (isEnPassantCapture && enPassantPawnSquare) {
        const enPassantCapturedPiece = pieces[enPassantPawnSquare];

        if (enPassantCapturedPiece) {
          capturedPieces.push({
            side: enPassantCapturedPiece.side,
            type: enPassantCapturedPiece.type,
          });
        }
      }
      const fromFile = 'ABCDEFGHIJK'.indexOf(from[0]);
      const toFile = 'ABCDEFGHIJK'.indexOf(target[0]);

      // Castling detection
      const isCastling =
        kingMove && from[1] === target[1] && Math.abs(toFile - fromFile) === 2;

      // Remove captured Pawn during En passant
      if (isEnPassantCapture && enPassantPawnSquare) {
        delete pieces[enPassantPawnSquare];
      }

      // Move the selected piece
      delete pieces[from];
      movingPiece.moved = true;
      pieces[target] = movingPiece;

      // Reassign privilege if a designated Guardian was captured
      if (capturedWhitePrivilegedGuardian) {
        reassignPrivilegedGuardian('white');
      }

      if (capturedBlackPrivilegedGuardian) {
        reassignPrivilegedGuardian('black');
      }
      // PRIVILEGED GUARDIAN JOURNEY
      if (isWhitePrivilegedGuardian) {
        whiteGuardianCurrentSquare = target;

        // White must reach rank 11
        if (Number(target.slice(1)) === 11) {
          whiteGuardianReachedEnd = true;
        }

        // Promote only after returning to its original square
        if (whiteGuardianReachedEnd && target === whitePrivilegedGuardian) {
          promoteGuardian(movingPiece, 'white');
        }
      }

      if (isBlackPrivilegedGuardian) {
        blackGuardianCurrentSquare = target;

        // Black must reach rank 1
        if (Number(target.slice(1)) === 1) {
          blackGuardianReachedEnd = true;
        }

        // Promote only after returning to its original square
        if (blackGuardianReachedEnd && target === blackPrivilegedGuardian) {
          promoteGuardian(movingPiece, 'black');
        }
      }

      // Clear previous En passant opportunity
      enPassantTarget = null;
      enPassantPawnSquare = null;

      // Record new En passant opportunity
      const fromRank = Number(from.slice(1));
      const toRank = Number(target.slice(1));

      if (
        movingPiece.type === 'P' &&
        from[0] === target[0] &&
        Math.abs(toRank - fromRank) === 2
      ) {
        const passedRank = (fromRank + toRank) / 2;

        enPassantTarget = `${from[0]}${passedRank}`;
        enPassantPawnSquare = target;
      }

      // CASTLING ROOK MOVEMENT
      // CASTLING ROOK MOVEMENT
      if (isCastling) {
        const direction = toFile > fromFile ? 1 : -1;
        const rookRank = from.slice(1);
        const rookSearchFiles = 'ABCDEFGHIJK';

        let rookSquare: string | null = null;

        // Search from the original King square, skipping its destination
        for (let distance = 3; distance <= 5; distance++) {
          const fileIndex = fromFile + direction * distance;

          if (fileIndex < 0 || fileIndex >= 11) break;

          const square = `${rookSearchFiles[fileIndex]}${rookRank}`;

          const candidate = pieces[square];

          if (
            candidate &&
            candidate.side === movingPiece.side &&
            candidate.type === 'R' &&
            !candidate.moved
          ) {
            rookSquare = square;
            break;
          }
        }

        if (rookSquare) {
          const rook = pieces[rookSquare];
          const rookDestinationFile = toFile - direction;

          const rookDestination = `${rookSearchFiles[rookDestinationFile]}${rookRank}`;

          delete pieces[rookSquare];
          rook.moved = true;
          pieces[rookDestination] = rook;
        }
      }

      // PAWN PROMOTION
      const promotionRank = movingPiece.side === 'white' ? 11 : 1;

      if (
        movingPiece.type === 'P' &&
        Number(target.slice(1)) === promotionRank
      ) {
        const choice = prompt(
          'Promote your Pawn:\nQ = Queen\nR = Rook\nB = Bishop\nN = Knight\nA = Archer',
          'Q'
        );

        const selectedPromotion = (choice || 'Q').toUpperCase();

        const allowedPromotions: PieceType[] = ['Q', 'R', 'B', 'N', 'A'];

        movingPiece.type = allowedPromotions.includes(
          selectedPromotion as PieceType
        )
          ? (selectedPromotion as PieceType)
          : 'Q';
      }
      // SPECIAL SQUARE BONUS CAPTURE
      if (isSpecialSquareCapture) {
        offerSpecialSquareBonusCapture(movingPiece.side);
      }

      // Finish the move
      selected = null;
      legalTargets = [];

      turn = turn === 'white' ? 'black' : 'white';

      recordCurrentPosition();

      const playerName = getPlayerName(turn);
      const opponentInCheck = isInCheck(turn);

      if (isInsufficientMaterial()) {
        gameOver = true;
        gameMessage.textContent = 'DRAW! Insufficient material.';
      } else if (!hasAnyLegalMove(turn)) {
        gameOver = true;

        if (opponentInCheck) {
          gameMessage.textContent = `CHECKMATE! ${getPlayerName(
            previousTurn
          )} WINS!`;
        } else {
          gameMessage.textContent = 'STALEMATE! The game is a DRAW.';
        }
      } else if (opponentInCheck) {
        gameMessage.textContent = `${playerName} King is in CHECK!`;
      } else {
        gameMessage.textContent = `${playerName} to move.`;
      }
      renderBoard();
      return;
    }
  }

  // Select a piece
  if (clickedPiece && clickedPiece.side === turn) {
    selected = target;
    legalTargets = getMoves(target);

    gameMessage.textContent = `${target} selected · ${legalTargets.length} possible moves`;
  } else {
    selected = null;
    legalTargets = [];

    gameMessage.textContent = 'Select one of your pieces.';
  }

  renderBoard();
}

selectPrivilegedGuardians();
recordCurrentPosition();
renderBoard();
claimDrawButton.addEventListener('click', () => {
  const key = getPositionKey();

  if ((positionCounts.get(key) ?? 0) >= 3 && !gameOver) {
    gameOver = true;
    gameMessage.textContent = 'DRAW CLAIMED! Threefold repetition.';
    claimDrawButton.style.display = 'none';
    renderBoard();
  }
});
newGameButton.addEventListener('click', () => {
  const confirmed = confirm(
    'Start a new game? Your current game will be lost.'
  );

  if (!confirmed) return;

  startNewGame();
});
capturedPiecesButton.addEventListener('click', () => {
  capturedPiecesVisible = !capturedPiecesVisible;
  renderCapturedPieces();
});
// Pause the current game
exitButton.addEventListener('click', () => {
  gamePaused = true;
  pauseScreen.style.display = 'flex';
});

// Continue the paused game
continueGameButton.addEventListener('click', () => {
  gamePaused = false;
  pauseScreen.style.display = 'none';
});
// Edit player names
editPlayerNamesButton.addEventListener('click', () => {
  const newWhiteName = prompt('Enter White player name:', playerNames.white);

  if (newWhiteName === null) return;

  const newBlackName = prompt('Enter Black player name:', playerNames.black);

  if (newBlackName === null) return;

  // Keep existing names if the input is empty
  playerNames.white = newWhiteName.trim() || playerNames.white;
  playerNames.black = newBlackName.trim() || playerNames.black;

  // Update displayed names
  whitePlayerNameDisplay.textContent = playerNames.white;
  blackPlayerNameDisplay.textContent = playerNames.black;

  // Refresh the turn indicator
  renderBoard();
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.error(
          'Service worker registration failed:',
          error
        );
      });
  });
}