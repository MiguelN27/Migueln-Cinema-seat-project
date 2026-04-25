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

type AdjacentSeatSuggestion = {
  rowLetter: string;
  seatNumbers: number[];
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
  const suggestions = findAdjacentAvailableSeatSuggestions(seatingMatrix, 2, 1);
  const firstSuggestion = suggestions[0];

  if (!firstSuggestion) {
    return "No adjacent seats found, try another movie schedule!";
  }

  return {
    rowLetter: firstSuggestion.rowLetter,
    firstSeatNumber: firstSuggestion.seatNumbers[0],
    secondSeatNumber: firstSuggestion.seatNumbers[1],
    message: firstSuggestion.message,
  };
}

function findAdjacentAvailableSeatSuggestions(
  seatingMatrix: SeatingMatrix,
  seatsRequested: number,
  maxSuggestions = 4,
  rowLabels?: string[]
): AdjacentSeatSuggestion[] {
  if (
    seatingMatrix.length === 0 ||
    seatingMatrix[0].length === 0 ||
    seatsRequested < 2 ||
    maxSuggestions < 1
  ) {
    return [];
  }

  const seatsPerRow = seatingMatrix[0].length;

  if (seatsRequested > seatsPerRow) {
    return [];
  }

  type CandidateSuggestion = {
    rowIndex: number;
    columnIndex: number;
    rowLetter: string;
    seatNumbers: number[];
  };

  const candidates: CandidateSuggestion[] = [];

  for (let rowIndex = 0; rowIndex < seatingMatrix.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex <= seatsPerRow - seatsRequested; columnIndex += 1) {
      let isWindowAvailable = true;

      for (let offset = 0; offset < seatsRequested; offset += 1) {
        if (seatingMatrix[rowIndex][columnIndex + offset] !== 0) {
          isWindowAvailable = false;
          break;
        }
      }

      if (!isWindowAvailable) {
        continue;
      }

      const rowLetter = rowLabels?.[rowIndex] ?? getRowLabel(rowIndex);
      const seatNumbers = Array.from(
        { length: seatsRequested },
        (_, offset) => seatsPerRow - (columnIndex + offset)
      );

      candidates.push({ rowIndex, columnIndex, rowLetter, seatNumbers });
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  function candidatesOverlap(candidateA: CandidateSuggestion, candidateB: CandidateSuggestion): boolean {
    if (candidateA.rowIndex !== candidateB.rowIndex) {
      return false;
    }

    const startA = candidateA.columnIndex;
    const endA = candidateA.columnIndex + seatsRequested - 1;
    const startB = candidateB.columnIndex;
    const endB = candidateB.columnIndex + seatsRequested - 1;

    return startA <= endB && startB <= endA;
  }

  function pickNearestCandidateIndex(
    targetIndex: number,
    usedIndexes: Set<number>,
    selectedCandidates: CandidateSuggestion[],
    avoidOverlap: boolean
  ): number {
    const maxDistance = candidates.length - 1;

    for (let distance = 0; distance <= maxDistance; distance += 1) {
      const offsets = distance === 0 ? [0] : [-distance, distance];

      for (const offset of offsets) {
        const candidateIndex = targetIndex + offset;

        if (candidateIndex < 0 || candidateIndex >= candidates.length || usedIndexes.has(candidateIndex)) {
          continue;
        }

        if (!avoidOverlap) {
          return candidateIndex;
        }

        const hasOverlap = selectedCandidates.some((selectedCandidate) =>
          candidatesOverlap(selectedCandidate, candidates[candidateIndex])
        );

        if (!hasOverlap) {
          return candidateIndex;
        }
      }
    }

    return -1;
  }

  const targetSuggestions = Math.min(maxSuggestions, candidates.length);
  const selectedCandidates: CandidateSuggestion[] = [];
  const usedIndexes = new Set<number>();

  for (let suggestionIndex = 0; suggestionIndex < targetSuggestions; suggestionIndex += 1) {
    const targetIndex =
      targetSuggestions === 1
        ? 0
        : Math.round((suggestionIndex * (candidates.length - 1)) / (targetSuggestions - 1));

    const candidateIndex = pickNearestCandidateIndex(targetIndex, usedIndexes, selectedCandidates, true);

    if (candidateIndex === -1) {
      continue;
    }

    usedIndexes.add(candidateIndex);
    selectedCandidates.push(candidates[candidateIndex]);
  }

  while (selectedCandidates.length < targetSuggestions) {
    const fillTargetIndex = Math.round(
      (selectedCandidates.length * (candidates.length - 1)) /
        Math.max(targetSuggestions - 1, 1)
    );
    const candidateIndex = pickNearestCandidateIndex(fillTargetIndex, usedIndexes, selectedCandidates, false);

    if (candidateIndex === -1) {
      break;
    }

    usedIndexes.add(candidateIndex);
    selectedCandidates.push(candidates[candidateIndex]);
  }

  return selectedCandidates.map((candidate) => {
    const seatCodes = candidate.seatNumbers.map((seatNumber) => `${candidate.rowLetter}${seatNumber}`);

    return {
      rowLetter: candidate.rowLetter,
      seatNumbers: candidate.seatNumbers,
      message: `Suggested seats: ${seatCodes.join(", ")}`,
    };
  });
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
  "border-cinema-accent/80",
  "bg-cinema-accent/55",
  "text-cinema-bg",
];

const SUGGESTED_SEAT_CLASSES = [
  "border-cinema-accent/50",
  "bg-cinema-accent/30",
  "text-white",
  "transition",
  "hover:-translate-y-0.5",
  "hover:border-cinema-accent",
  "hover:bg-cinema-accent/40",
];

function setSeatAsAvailable(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...SUGGESTED_SEAT_CLASSES);
  seatButton.classList.remove(...SELECTED_SEAT_CLASSES);
  seatButton.classList.add(...AVAILABLE_SEAT_CLASSES);
  seatButton.disabled = false;
  seatButton.setAttribute("aria-disabled", "false");
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} available`);
  seatButton.setAttribute("aria-pressed", "false");
}

function setSeatAsSelected(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...SUGGESTED_SEAT_CLASSES);
  seatButton.classList.remove(...AVAILABLE_SEAT_CLASSES);
  seatButton.classList.add(...SELECTED_SEAT_CLASSES);
  seatButton.disabled = false;
  seatButton.setAttribute("aria-disabled", "false");
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} selected`);
  seatButton.setAttribute("aria-pressed", "true");
}

function setSeatAsSuggested(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...AVAILABLE_SEAT_CLASSES);
  seatButton.classList.remove(...SELECTED_SEAT_CLASSES);
  seatButton.classList.add(...SUGGESTED_SEAT_CLASSES);
  seatButton.disabled = false;
  seatButton.setAttribute("aria-disabled", "false");
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} suggested`);
  seatButton.setAttribute("aria-pressed", "false");
}

function setSeatAsReserved(seatButton: HTMLButtonElement): void {
  seatButton.classList.remove(...SUGGESTED_SEAT_CLASSES);
  seatButton.classList.remove(...SELECTED_SEAT_CLASSES);
  seatButton.classList.remove(...AVAILABLE_SEAT_CLASSES);
  seatButton.disabled = true;
  seatButton.setAttribute("aria-disabled", "true");
  const seatCode = seatButton.dataset.seatCode ?? seatButton.textContent?.trim() ?? "";
  seatButton.setAttribute("aria-label", `Seat ${seatCode} reserved`);
  seatButton.setAttribute("aria-pressed", "false");
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
  const selectionAnnouncer = document.getElementById("seat-selection-announcer") as HTMLParagraphElement | null;

  if (!seatCountInput || !decreaseButton || !increaseButton || !selectionProgress || !selectionAnnouncer) {
    return;
  }

  const seatCountInputElement = seatCountInput;
  const decreaseButtonElement = decreaseButton;
  const increaseButtonElement = increaseButton;
  const selectionProgressElement = selectionProgress;
  const selectionAnnouncerElement = selectionAnnouncer;

  function announceSelectionUpdate(message: string): void {
    selectionAnnouncerElement.textContent = "";
    requestAnimationFrame(() => {
      selectionAnnouncerElement.textContent = message;
    });
  }

  seatCountInputElement.setAttribute("aria-controls", "seat-grid");
  seatCountInputElement.setAttribute("aria-describedby", "seat-map-instructions seat-selection-progress");
  decreaseButtonElement.setAttribute("aria-controls", "seat-count-input");
  increaseButtonElement.setAttribute("aria-controls", "seat-count-input");

  const maxSelectableSeats = availableSeatButtons.length;
  const selectedSeats: HTMLButtonElement[] = [];
  const suggestedSeats = new Set<HTMLButtonElement>();
  const rowSeats = new Map<string, Map<number, HTMLButtonElement>>();

  for (const seatButton of seatButtons) {
    const rawAriaLabel = seatButton.getAttribute("aria-label") ?? "";
    const seatMatch = rawAriaLabel.match(/Seat\s+([A-Z]\d+)/i);
    if (seatMatch) {
      const normalizedSeatCode = seatMatch[1].toUpperCase();
      seatButton.dataset.seatCode = normalizedSeatCode;

      const parsedSeat = normalizedSeatCode.match(/^([A-Z])(\d+)$/);
      if (parsedSeat) {
        const [, rowLetter, seatNumberText] = parsedSeat;
        const seatNumber = Number(seatNumberText);
        seatButton.dataset.rowLetter = rowLetter;
        seatButton.dataset.seatNumber = String(seatNumber);
        const rowSeatMap = rowSeats.get(rowLetter) ?? new Map<number, HTMLButtonElement>();

        rowSeatMap.set(seatNumber, seatButton);
        rowSeats.set(rowLetter, rowSeatMap);
      }
    }

    const isAvailableSeat = (seatButton.getAttribute("aria-label") ?? "").toLowerCase().includes("available");
    const isReservedSeat = (seatButton.getAttribute("aria-label") ?? "").toLowerCase().includes("reserved");
    if (isAvailableSeat) {
      setSeatAsAvailable(seatButton);
    } else if (isReservedSeat) {
      setSeatAsReserved(seatButton);
    }
  }

  function focusSeatInDirection(currentSeatButton: HTMLButtonElement, key: string): void {
    const currentRowLetter = currentSeatButton.dataset.rowLetter;
    const currentSeatNumberText = currentSeatButton.dataset.seatNumber;

    if (!currentRowLetter || !currentSeatNumberText) {
      return;
    }

    const currentSeatNumber = Number(currentSeatNumberText);
    if (Number.isNaN(currentSeatNumber)) {
      return;
    }

    const rowLabels = Array.from(rowSeats.keys()).sort();
    const currentRowIndex = rowLabels.indexOf(currentRowLetter);
    if (currentRowIndex < 0) {
      return;
    }

    let targetRowLetter = currentRowLetter;
    let targetSeatNumber = currentSeatNumber;

    if (key === "ArrowLeft") {
      targetSeatNumber += 1;
    } else if (key === "ArrowRight") {
      targetSeatNumber -= 1;
    } else if (key === "ArrowUp") {
      targetRowLetter = rowLabels[Math.max(0, currentRowIndex - 1)];
    } else if (key === "ArrowDown") {
      targetRowLetter = rowLabels[Math.min(rowLabels.length - 1, currentRowIndex + 1)];
    }

    const targetRowSeatMap = rowSeats.get(targetRowLetter);
    const targetSeatButton = targetRowSeatMap?.get(targetSeatNumber);

    if (targetSeatButton && !targetSeatButton.disabled) {
      targetSeatButton.focus();
    }
  }

  function buildCurrentSeatingMatrix(): { matrix: SeatingMatrix; rowLabels: string[]; seatsPerRow: number } {
    const rowLabels = Array.from(rowSeats.keys()).sort();
    const seatsPerRow = rowLabels.reduce((maximum, rowLabel) => {
      const rowSeatMap = rowSeats.get(rowLabel);
      if (!rowSeatMap) {
        return maximum;
      }

      return Math.max(maximum, rowSeatMap.size);
    }, 0);

    const matrix = rowLabels.map((rowLabel) => {
      const rowSeatMap = rowSeats.get(rowLabel) ?? new Map<number, HTMLButtonElement>();

      return Array.from({ length: seatsPerRow }, (_, columnIndex) => {
        const seatNumber = seatsPerRow - columnIndex;
        const seatButton = rowSeatMap.get(seatNumber);

        if (!seatButton) {
          return 1 as Seat;
        }

        const isReservedSeat = (seatButton.getAttribute("aria-label") ?? "").toLowerCase().includes("reserved");
        const isSelectedSeat = selectedSeats.includes(seatButton);

        if (isReservedSeat || isSelectedSeat) {
          return 1 as Seat;
        }

        return 0 as Seat;
      });
    });

    return { matrix, rowLabels, seatsPerRow };
  }

  function clearSuggestedSeats(): void {
    for (const seatButton of suggestedSeats) {
      if (!selectedSeats.includes(seatButton)) {
        setSeatAsAvailable(seatButton);
      }
    }

    suggestedSeats.clear();
  }

  function applySeatSuggestions(): void {
    clearSuggestedSeats();

    const requestedSeats = Number(seatCountInputElement.value);
    if (requestedSeats < 2 || requestedSeats > 5) {
      return;
    }

    const { matrix, rowLabels, seatsPerRow } = buildCurrentSeatingMatrix();

    if (seatsPerRow === 0) {
      return;
    }

    const suggestions = findAdjacentAvailableSeatSuggestions(matrix, requestedSeats, 4, rowLabels);

    for (const suggestion of suggestions) {
      const rowSeatMap = rowSeats.get(suggestion.rowLetter);

      if (!rowSeatMap) {
        continue;
      }

      for (const seatNumber of suggestion.seatNumbers) {
        const seatButton = rowSeatMap.get(seatNumber);

        if (!seatButton || selectedSeats.includes(seatButton)) {
          continue;
        }

        setSeatAsSuggested(seatButton);
        suggestedSeats.add(seatButton);
      }
    }

    if (suggestions.length > 0) {
      announceSelectionUpdate(`${suggestions.length} seat suggestions available.`);
    }
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

    decreaseButtonElement.disabled = clampedValue <= 1;
    increaseButtonElement.disabled = clampedValue >= maxSelectableSeats;
    decreaseButtonElement.setAttribute("aria-disabled", String(decreaseButtonElement.disabled));
    increaseButtonElement.setAttribute("aria-disabled", String(increaseButtonElement.disabled));

    updateProgress();
    applySeatSuggestions();
    announceSelectionUpdate(`Selection limit set to ${clampedValue} seats.`);
  }

  function toggleSeatSelection(seatButton: HTMLButtonElement): void {
    const currentLimit = Number(seatCountInputElement.value);
    const selectedSeatIndex = selectedSeats.indexOf(seatButton);

    if (selectedSeatIndex >= 0) {
      selectedSeats.splice(selectedSeatIndex, 1);
      setSeatAsAvailable(seatButton);
      updateProgress();
      applySeatSuggestions();
      const seatCode = seatButton.dataset.seatCode ?? "this seat";
      announceSelectionUpdate(`${seatCode} removed from your selection.`);
      return;
    }

    if (selectedSeats.length >= currentLimit) {
      announceSelectionUpdate(`You can select up to ${currentLimit} seats.`);
      return;
    }

    selectedSeats.push(seatButton);
    setSeatAsSelected(seatButton);
    updateProgress();
    applySeatSuggestions();
    const seatCode = seatButton.dataset.seatCode ?? "this seat";
    announceSelectionUpdate(`${seatCode} selected.`);
  }

  for (const seatButton of availableSeatButtons) {
    seatButton.addEventListener("click", () => {
      toggleSeatSelection(seatButton);
    });

    seatButton.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        focusSeatInDirection(seatButton, event.key);
      }
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
