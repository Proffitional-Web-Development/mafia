export function getAutoMafiaCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

export function getMaxAllowedMafia(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}

export function validateMafiaCount(
  mafiaCount: number,
  playerCount: number
): { valid: boolean; maxAllowed: number; error?: string } {
  const maxAllowed = getMaxAllowedMafia(playerCount);

  if (!Number.isInteger(mafiaCount)) {
    return {
      valid: false,
      maxAllowed,
      error: "Mafia count must be an integer.",
    };
  }

  if (mafiaCount < 1) {
    return {
      valid: false,
      maxAllowed,
      error: "Mafia count must be at least 1.",
    };
  }

  if (mafiaCount >= Math.ceil(playerCount / 2)) {
    return {
      valid: false,
      maxAllowed,
      error: `Mafia count must be less than ${Math.ceil(playerCount / 2)} for ${playerCount} players.`,
    };
  }

  return {
    valid: true,
    maxAllowed,
  };
}
