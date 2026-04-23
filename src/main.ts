type Seat = 0 | 1;
type SeatingMatrix = Seat[][];
type SeatCountSummary = {
  occupied: number;
  available: number;
};

type AdjacentSeatSearchResult = {
  rowLetter: string;
  firstSeatNumber: number;
  secondSeatNumber: number;
  message: string;
};

function initializeSeatingMatrix(rows = 8, seatsPerRow = 10): SeatingMatrix {
  return Array.from({ length: rows }, () => Array<Seat>(seatsPerRow).fill(0));
}

function getRowLabel(rowIndex: number): string {
  return String.fromCharCode(65 + rowIndex);
}

function displayScreeningRoom(seatingMatrix: SeatingMatrix): void {
  if (seatingMatrix.length === 0 || seatingMatrix[0].length === 0) {
    console.log("Screening room has no seats to display.");
    return;
  }

  const seatsTable = seatingMatrix.map((row, rowIndex) => ({
    row: getRowLabel(rowIndex),
    ...row.reduce<Record<string, string>>((accumulator, seat, columnIndex) => {
      const seatNumber = row.length - columnIndex;
      accumulator[String(seatNumber)] = seat === 1 ? "X" : "L";
      return accumulator;
    }, {}),
  }));

  console.table(seatsTable);
}

function reserveSeat(
  seatingMatrix: SeatingMatrix,
  rowLetter: string,
  columnNumber: number
): string {
  if (seatingMatrix.length === 0 || seatingMatrix[0].length === 0) {
    return "Reservation failed: screening room has no seats.";
  }

  const normalizedRowLetter = rowLetter.trim().toUpperCase();
  const rowIndex = normalizedRowLetter.charCodeAt(0) - 65;
  const seatsPerRow = seatingMatrix[0].length;

  if (
    normalizedRowLetter.length !== 1 ||
    rowIndex < 0 ||
    rowIndex >= seatingMatrix.length
  ) {
    return `Reservation failed: row ${rowLetter} is invalid.`;
  }

  if (columnNumber < 1 || columnNumber > seatsPerRow) {
    return `Reservation failed: column ${columnNumber} is invalid.`;
  }

  // Column labels run from right to left, so seat 1 is the rightmost index.
  const columnIndex = seatsPerRow - columnNumber;

  if (seatingMatrix[rowIndex][columnIndex] === 1) {
    return `Reservation failed: seat ${normalizedRowLetter}${columnNumber} is already occupied.`;
  }

  seatingMatrix[rowIndex][columnIndex] = 1;
  return `Reservation successful: seat ${normalizedRowLetter}${columnNumber} has been reserved.`;
}

function countSeats(seatingMatrix: SeatingMatrix): SeatCountSummary {
  let occupied = 0;
  let available = 0;

  for (const row of seatingMatrix) {
    for (const seat of row) {
      if (seat === 1) {
        occupied += 1;
      } else {
        available += 1;
      }
    }
  }

  return { occupied, available };
}

function findFirstAdjacentAvailableSeats(
  seatingMatrix: SeatingMatrix
): AdjacentSeatSearchResult | string {
  if (seatingMatrix.length === 0 || seatingMatrix[0].length === 0) {
    return "No adjacent seats found, try another movie schedule!";
  }

  const seatsPerRow = seatingMatrix[0].length;

  for (let rowIndex = 0; rowIndex < seatingMatrix.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < seatsPerRow - 1; columnIndex += 1) {
      if (
        seatingMatrix[rowIndex][columnIndex] === 0 &&
        seatingMatrix[rowIndex][columnIndex + 1] === 0
      ) {
        const rowLetter = getRowLabel(rowIndex);
        const firstSeatNumber = seatsPerRow - columnIndex;
        const secondSeatNumber = seatsPerRow - (columnIndex + 1);

        return {
          rowLetter,
          firstSeatNumber,
          secondSeatNumber,
          message: `Adjacent seats found: ${rowLetter}${firstSeatNumber} and ${rowLetter}${secondSeatNumber}`,
        };
      }
    }
  }

  return "No adjacent seats found, try another movie schedule!";
}

function countAdjacentAvailableSeatPairs(seatingMatrix: SeatingMatrix): number {
  if (seatingMatrix.length === 0 || seatingMatrix[0].length === 0) {
    return 0;
  }

  const seatsPerRow = seatingMatrix[0].length;
  let adjacentPairs = 0;

  for (let rowIndex = 0; rowIndex < seatingMatrix.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < seatsPerRow - 1; columnIndex += 1) {
      if (
        seatingMatrix[rowIndex][columnIndex] === 0 &&
        seatingMatrix[rowIndex][columnIndex + 1] === 0
      ) {
        adjacentPairs += 1;
      }
    }
  }

  return adjacentPairs;
}

const seatingMatrix = initializeSeatingMatrix();
console.log("Cinema screening room (L = available, X = occupied):");
displayScreeningRoom(seatingMatrix);

console.log(reserveSeat(seatingMatrix, "B", 3));
console.log(reserveSeat(seatingMatrix, "B", 3));
displayScreeningRoom(seatingMatrix);
const seatCount = countSeats(seatingMatrix);
console.log(`Occupied seats: ${seatCount.occupied}`);
console.log(`Available seats: ${seatCount.available}`);
console.log(findFirstAdjacentAvailableSeats(seatingMatrix));
console.log(`Adjacent available seat pairs: ${countAdjacentAvailableSeatPairs(seatingMatrix)}`);

export {
  countAdjacentAvailableSeatPairs,
  countSeats,
  displayScreeningRoom,
  findFirstAdjacentAvailableSeats,
  initializeSeatingMatrix,
  reserveSeat,
  type AdjacentSeatSearchResult,
  type SeatCountSummary,
  type Seat,
  type SeatingMatrix,
};
