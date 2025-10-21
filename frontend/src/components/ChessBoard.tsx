import { useState } from "react";
import type { Square, PieceSymbol, Color } from "chess.js";

import wP from "../pieces/wP.png";
import wR from "../pieces/wR.png";
import wN from "../pieces/wN.png";
import wB from "../pieces/wB.png";
import wQ from "../pieces/wQ.png";
import wK from "../pieces/wK.png";
import bP from "../pieces/bP.png";
import bR from "../pieces/bR.png";
import bN from "../pieces/bN.png";
import bB from "../pieces/bB.png";
import bQ from "../pieces/bQ.png";
import bK from "../pieces/bK.png";

const pieceImages: Record<string, string> = {
  wP,
  wR,
  wN,
  wB,
  wQ,
  wK,
  bP,
  bR,
  bN,
  bB,
  bQ,
  bK,
};

export const ChessBoard = ({
  chess,
  board,
  socket,
  setBoard,
  playerColor,
}: {
  chess: any;
  setBoard: any;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
  playerColor: string;
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [legalMoves, setLegalMoves] = useState<
    { to: Square; captured?: PieceSymbol }[]
  >([]);

  const getPieceImage = (piece: { type: PieceSymbol; color: Color } | null) => {
    if (!piece || !piece.type || !piece.color) return "";
    const key = `${piece.color}${piece.type.toUpperCase()}`;
    return pieceImages[key];
  };

  const colorValidator = (pc: Color | undefined) => {
    if (!pc) return false;
    if (pc === "w" && playerColor === "white") return true;
    if (pc === "b" && playerColor === "black") return true;
    return false;
  };

  const handleSquareClick = (squareRepresentation: Square, square: any) => {
    if (from === squareRepresentation) {
      setFrom(null);
      setLegalMoves([]);
      return;
    }

    if (!from) {
      if (square && colorValidator(chess.get(squareRepresentation)?.color)) {
        setFrom(squareRepresentation);
        const moves = chess
          .moves({ square: squareRepresentation, verbose: true })
          .map((m: any) => ({ to: m.to, captured: m.captured }));
        setLegalMoves(moves);
      }
      return;
    }

    if (
      square &&
      chess.get(from)?.color === chess.get(squareRepresentation)?.color
    ) {
      setFrom(squareRepresentation);
      const moves = chess
        .moves({ square: squareRepresentation, verbose: true })
        .map((m: any) => ({ to: m.to, captured: m.captured }));
      setLegalMoves(moves);
      return;
    }

    const move = legalMoves.find((m) => m.to === squareRepresentation);
    if (move && colorValidator(chess.get(from)?.color)) {
      try {
        const result = chess.move({ from, to: move.to });
        if (result) {
          socket.send(
            JSON.stringify({
              type: "move",
              payload: { move: { from, to: move.to } },
            })
          );
          setBoard(chess.board());
        }
      } catch (err) {
        console.error("Invalid move:", err);
      }
    }

    setFrom(null);
    setLegalMoves([]);
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

  // ✅ Flip both ranks and files for black
  const displayedFiles = playerColor === "black" ? [...files].reverse() : files;
  const displayedRanks = playerColor === "black" ? [...ranks].reverse() : ranks;
  const displayedBoard = playerColor === "black" ? [...board].reverse() : board;

  return (
    <div className="inline-block border border-gray-700 bg-neutral-800 p-3 rounded-lg shadow-lg">
      {displayedBoard.map((row, i) => {
        const displayRow = playerColor === "black" ? [...row].reverse() : row;
        const rankIndex = displayedRanks[7 - i];

        return (
          <div className="flex" key={i}>
            {displayRow.map((square, j) => {
              const fileLetter = displayedFiles[j];
              const squareRepresentation = (fileLetter + rankIndex) as Square;
              const isDark = (i + j) % 2 === 1;
              const squareColor = isDark ? "bg-green-700" : "bg-green-300";
              const isSelected = from === squareRepresentation;

              const moveInfo = legalMoves.find(
                (m) => m.to === squareRepresentation
              );
              const isMoveHint = !!moveInfo;
              const isCaptureMove = moveInfo?.captured;

              const showFileLabel =
                rankIndex === (playerColor === "white" ? "1" : "8");
              const showRankLabel =
                fileLetter === (playerColor === "white" ? "a" : "h");

              return (
                <div
                  key={j}
                  onClick={() =>
                    handleSquareClick(squareRepresentation, square)
                  }
                  className={`${squareColor} w-16 h-16 flex items-center justify-center relative select-none transition-all duration-150 ${
                    isSelected ? "bg-yellow-300" : ""
                  }`}
                >
                  {square && (
                    <img
                      src={getPieceImage(square)}
                      alt={`${square.color}${square.type}`}
                      className="w-12 h-12 pointer-events-none select-none"
                    />
                  )}

                  {!square && isMoveHint && !isCaptureMove && (
                    <div className="absolute w-4 h-4 bg-black/40 rounded-full"></div>
                  )}
                  {isCaptureMove && (
                    <div className="absolute w-15 h-15 border-6 border-black/40 rounded-full pointer-events-none"></div>
                  )}

                  {showFileLabel && (
                    <span
                      className={`absolute bottom-0.5 right-0.5 text-md font-semibold ${
                        squareColor == "bg-green-300"
                          ? "text-green-700"
                          : "text-green-300"
                      }`}
                    >
                      {fileLetter}
                    </span>
                  )}
                  {showRankLabel && (
                    <span
                      className={`absolute top-0.5 left-0.5 text-md font-semibold ${
                        squareColor == "bg-green-300"
                          ? "text-green-700"
                          : "text-green-300"
                      }`}
                    >
                      {rankIndex}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
