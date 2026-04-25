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

const AVAILABLE_SEAT_CLASSES = [
  "border-cinema-main/30",
  "bg-cinema-main/20",
  "transition",
  "hover:-translate-y-0.5",
  "hover:border-cinema-accent",
  "hover:bg-cinema-accent/20",
];

const SELECTED_SEAT_CLASSES = [
  "border-cinema-accent/50",
  "bg-cinema-accent/30",
  "text-white",
];

function setSeatAsAvailable(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...SELECTED_SEAT_CLASSES);
  seatButton.classList.add(...AVAILABLE_SEAT_CLASSES);
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} available`);
  seatButton.setAttribute("aria-pressed", "false");
}

function setSeatAsSelected(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...AVAILABLE_SEAT_CLASSES);
  seatButton.classList.add(...SELECTED_SEAT_CLASSES);
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} selected`);
  seatButton.setAttribute("aria-pressed", "true");
}

function initializeInteractiveSeatSelection(): void {
  if (typeof document === "undefined") {
    return;
  }

  const seatButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('section[aria-label="Seat grid"] button')
  );

  if (seatButtons.length === 0) {
    return;
  }

  const availableSeatButtons = seatButtons.filter((button) => {
    const ariaLabel = button.getAttribute("aria-label")?.toLowerCase() ?? "";
    return ariaLabel.includes("available");
  });

  const seatCountInput = document.getElementById("seat-count-input") as HTMLInputElement | null;
  const decreaseButton = document.getElementById("seat-count-decrease") as HTMLButtonElement | null;
  const increaseButton = document.getElementById("seat-count-increase") as HTMLButtonElement | null;
  const selectionProgress = document.getElementById("seat-selection-progress") as HTMLParagraphElement | null;

  if (!seatCountInput || !decreaseButton || !increaseButton || !selectionProgress) {
    return;
  }

  const seatCountInputElement = seatCountInput;
  const decreaseButtonElement = decreaseButton;
  const increaseButtonElement = increaseButton;
  const selectionProgressElement = selectionProgress;

  const maxSelectableSeats = availableSeatButtons.length;
  const selectedSeats: HTMLButtonElement[] = [];

  for (const seatButton of availableSeatButtons) {
    const rawAriaLabel = seatButton.getAttribute("aria-label") ?? "";
    const seatMatch = rawAriaLabel.match(/Seat\s+([A-Z]\d+)/i);
    if (seatMatch) {
      seatButton.dataset.seatCode = seatMatch[1].toUpperCase();
    }

    setSeatAsAvailable(seatButton);
  }

  function updateProgress(): void {
    const maximum = Number(seatCountInputElement.value);
    selectionProgressElement.textContent = `${selectedSeats.length} selected / ${maximum}`;
  }

  function updateSeatCountInput(value: number): void {
    const clampedValue = Math.max(1, Math.min(value, maxSelectableSeats));
    seatCountInputElement.value = String(clampedValue);
    seatCountInputElement.max = String(maxSelectableSeats);

    while (selectedSeats.length > clampedValue) {
      const seatToUnselect = selectedSeats.pop();
      if (seatToUnselect) {
        setSeatAsAvailable(seatToUnselect);
      }
    }

    updateProgress();
  }

  function toggleSeatSelection(seatButton: HTMLButtonElement): void {
    const currentLimit = Number(seatCountInputElement.value);
    const selectedSeatIndex = selectedSeats.indexOf(seatButton);

    if (selectedSeatIndex >= 0) {
      selectedSeats.splice(selectedSeatIndex, 1);
      setSeatAsAvailable(seatButton);
      updateProgress();
      return;
    }

    if (selectedSeats.length >= currentLimit) {
      return;
    }

    selectedSeats.push(seatButton);
    setSeatAsSelected(seatButton);
    updateProgress();
  }

  for (const seatButton of availableSeatButtons) {
    seatButton.addEventListener("click", () => {
      toggleSeatSelection(seatButton);
    });
  }

  decreaseButtonElement.addEventListener("click", () => {
    updateSeatCountInput(Number(seatCountInputElement.value) - 1);
  });

  increaseButtonElement.addEventListener("click", () => {
    updateSeatCountInput(Number(seatCountInputElement.value) + 1);
  });

  seatCountInputElement.addEventListener("change", () => {
    updateSeatCountInput(Number(seatCountInputElement.value));
  });

  updateSeatCountInput(Number(seatCountInputElement.value));
}

initializeInteractiveSeatSelection();

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
