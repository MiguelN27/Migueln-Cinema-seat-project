type Seat = 0 | 1;
type SeatingMatrix = Seat[][];

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

  const seatsPerRow = seatingMatrix[0].length;
  const columnLabels = Array.from(
    { length: seatsPerRow },
    (_, columnIndex) => String(seatsPerRow - columnIndex)
  );

  const header = `    ${columnLabels.map((label) => label.padStart(2, " ")).join(" ")}`;
  console.log(header);

  for (let rowIndex = 0; rowIndex < seatingMatrix.length; rowIndex += 1) {
    const rowLabel = getRowLabel(rowIndex);
    const rowSeats = seatingMatrix[rowIndex].map((seat) => (seat === 1 ? "X" : "L"));
    console.log(`${rowLabel} | ${rowSeats.map((seat) => seat.padStart(2, " ")).join(" ")}`);
  }
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

const seatingMatrix = initializeSeatingMatrix();
console.log("Cinema screening room (L = available, X = occupied):");
displayScreeningRoom(seatingMatrix);

console.log(reserveSeat(seatingMatrix, "B", 3));
console.log(reserveSeat(seatingMatrix, "B", 3));
displayScreeningRoom(seatingMatrix);

export {
  displayScreeningRoom,
  initializeSeatingMatrix,
  reserveSeat,
  type Seat,
  type SeatingMatrix,
};
