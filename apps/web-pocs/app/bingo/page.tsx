"use client";

import { useMemo, useState } from "react";

type BingoSquare = {
  phrase: string;
  selected: boolean;
};

const BINGO_PHRASES = [
  "Asked to repeat yourself",
  "Coffee refill #3",
  "Found a bug",
  "Awkward silence",
  "Meeting ran over",
  '"Can you see my screen?"',
  "Dog barking in background",
  "Lost internet connection",
  '"Sorry, I was on mute"',
  "Forgot password",
  "Email typo",
  "Accidental reply-all",
  "Lunch at desk",
  "Long loading screen",
  "Zoom froze",
  '"Let\'s circle back"',
  "Spilled drink",
  "Tab overload",
  "Notification spam",
  "Keyboard not working",
  '"Can everyone hear me?"',
  "Background noise",
  "Late to meeting",
  "Wrong Slack channel",
  "Desktop screenshot fail",
] as const;

const BOARD_SIZE = 5;
const FREE_SPACE_INDEX = Math.floor((BOARD_SIZE * BOARD_SIZE) / 2);

function shuffleArray<T>(items: readonly T[]): T[] {
  const shuffled = Array.from(items);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp!;
  }

  return shuffled as T[];
}

function generateBingoBoard(): BingoSquare[] {
  const phrases =
    BINGO_PHRASES.length >= BOARD_SIZE * BOARD_SIZE
      ? shuffleArray(BINGO_PHRASES).slice(0, BOARD_SIZE * BOARD_SIZE)
      : shuffleArray([
          ...BINGO_PHRASES,
          ...BINGO_PHRASES, // duplicate phrases if the list is short
        ]).slice(0, BOARD_SIZE * BOARD_SIZE);

  return phrases.map((phrase, index) => ({
    phrase,
    selected: index === FREE_SPACE_INDEX,
  }));
}

function getWinningLines(board: BingoSquare[]): string[] {
  if (board.length !== BOARD_SIZE * BOARD_SIZE) {
    return [];
  }

  const wins: string[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowStart = row * BOARD_SIZE;
    let isRowComplete = true;

    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = board[rowStart + col];
      if (!square || !square.selected) {
        isRowComplete = false;
        break;
      }
    }

    if (isRowComplete) {
      wins.push(`Row ${row + 1}`);
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let isColumnComplete = true;

    for (let row = 0; row < BOARD_SIZE; row++) {
      const square = board[row * BOARD_SIZE + col];
      if (!square || !square.selected) {
        isColumnComplete = false;
        break;
      }
    }

    if (isColumnComplete) {
      wins.push(`Column ${col + 1}`);
    }
  }

  let isPrimaryDiagonalComplete = true;
  for (let idx = 0; idx < BOARD_SIZE; idx++) {
    const square = board[idx * (BOARD_SIZE + 1)];
    if (!square || !square.selected) {
      isPrimaryDiagonalComplete = false;
      break;
    }
  }
  if (isPrimaryDiagonalComplete) {
    wins.push("Diagonal (\\)");
  }

  let isSecondaryDiagonalComplete = true;
  for (let idx = 1; idx <= BOARD_SIZE; idx++) {
    const square = board[idx * (BOARD_SIZE - 1)];
    if (!square || !square.selected) {
      isSecondaryDiagonalComplete = false;
      break;
    }
  }
  if (isSecondaryDiagonalComplete) {
    wins.push("Diagonal (/)");
  }

  return wins;
}

export default function BingoPage() {
  const [board, setBoard] = useState<BingoSquare[]>(() => generateBingoBoard());

  const winningLines = useMemo(() => getWinningLines(board), [board]);
  const hasBingo = winningLines.length > 0;

  const handleToggleSquare = (index: number) => {
    if (index === FREE_SPACE_INDEX) {
      return;
    }

    setBoard((current) =>
      current.map((square, squareIndex) =>
        squareIndex === index ? { ...square, selected: !square.selected } : square,
      ),
    );
  };

  const handleNewCard = () => {
    setBoard(generateBingoBoard());
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-10 pb-16">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary px-6 py-16 text-center text-primary-foreground shadow-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-foreground/10 blur-3xl" />
          <div className="absolute bottom-10 -right-10 h-52 w-52 rounded-full bg-background/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-accent/40 blur-2xl" />
        </div>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h1 className="text-balance text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">BINGO!</h1>
          <p className="text-balance text-lg text-primary-foreground/90 sm:text-xl">
            Mark the squares, chase the combos, and celebrate every triumphant row. Ready to shout it loud?
          </p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur sm:flex-row">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-semibold text-foreground">Game Board</h2>
            <p className="text-muted-foreground">
              Tap each square as it happens. Complete any row, column, or diagonal to win!
            </p>
          </div>

          <button
            type="button"
            onClick={handleNewCard}
            className="btn btn-secondary btn-lg flex items-center gap-2 shadow-lg transition hover:scale-[1.02]"
          >
            New Card
          </button>
        </div>

        {hasBingo && (
          <div className="rounded-3xl border-2 border-accent bg-accent/15 p-6 shadow-xl animate-in fade-in zoom-in duration-500">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-accent-foreground">
              <span className="text-2xl font-bold uppercase tracking-wide">Winner</span>
              <h3 className="text-2xl font-bold">BINGO! Winning lines unlocked:</h3>
            </div>
            <ul className="flex flex-wrap gap-2">
              {winningLines.map((line) => (
                <li
                  key={line}
                  className="badge badge-secondary border-none bg-secondary/90 text-secondary-foreground shadow-md"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl">
          <div
            className="grid grid-cols-5 gap-2 rounded-3xl border border-dashed border-primary/40 bg-card/70 p-4 shadow-lg backdrop-blur"
            role="grid"
            aria-label="Bingo board"
          >
            {board.map((square, index) => {
              const isFreeSpace = index === FREE_SPACE_INDEX;
              const isSelected = square.selected;

              return (
                <button
                  key={`${square.phrase}-${index}`}
                  type="button"
                  role="gridcell"
                  aria-pressed={isSelected}
                  disabled={isFreeSpace}
                  onClick={() => handleToggleSquare(index)}
                  className={[
                    "relative aspect-square rounded-2xl border-2 p-3 text-center transition-all duration-200",
                    "text-xs font-semibold uppercase tracking-tight text-balance sm:text-sm",
                    isFreeSpace
                      ? "cursor-default border-accent bg-accent/90 text-accent-foreground shadow-lg"
                      : "cursor-pointer bg-card text-card-foreground hover:scale-[1.03] hover:border-primary hover:shadow-xl",
                    isSelected && !isFreeSpace
                      ? "border-primary bg-primary text-primary-foreground shadow-xl ring-2 ring-primary/60"
                      : "",
                    !isSelected && !isFreeSpace ? "border-border" : "",
                  ].join(" ")}
                >
                  <span className="pointer-events-none block leading-tight">
                    {isFreeSpace ? "* Free Space *" : square.phrase}
                  </span>
                  {isSelected && !isFreeSpace && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl text-primary-foreground/80 drop-shadow-lg">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <article className="rounded-3xl border border-border bg-card/80 p-8 shadow-lg backdrop-blur">
          <h3 className="mb-4 text-2xl font-semibold text-foreground">How to Play</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li>Click any square to mark it when the phrase happens in real life.</li>
            <li>The sparkling center square is a freebie - it is marked from the start.</li>
            <li>Complete a row, column, or diagonal line to win and celebrate.</li>
            <li>Need a fresh challenge? Hit "New Card" to reshuffle the board.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

