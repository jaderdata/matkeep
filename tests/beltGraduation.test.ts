import { describe, it, expect } from 'vitest';
import { Belt } from '../types';

/**
 * Business Logic: Belt Graduation
 * 
 * Rules:
 * - Students need 4 degrees to graduate to the next belt
 * - After 4 degrees, reset to 0 and advance belt
 * - Belt progression follows the BJJ ranking system
 */

const BELT_PROGRESSION: Belt[] = [
    Belt.BRANCA,
    Belt.CINZA_BRANCA,
    Belt.CINZA,
    Belt.CINZA_PRETA,
    Belt.AMARELA_BRANCA,
    Belt.AMARELA,
    Belt.AMARELA_PRETA,
    Belt.LARANJA_BRANCA,
    Belt.LARANJA,
    Belt.LARANJA_PRETA,
    Belt.VERDE_BRANCA,
    Belt.VERDE,
    Belt.VERDE_PRETA,
    Belt.AZUL,
    Belt.ROXA,
    Belt.MARROM,
    Belt.PRETA,
    Belt.VERMELHA_PRETA,
    Belt.VERMELHA_BRANCA,
    Belt.VERMELHA,
];

export function calculateNextBelt(currentBelt: Belt, currentDegrees: number): { belt: Belt; degrees: number } {
    if (currentDegrees < 4) {
        return { belt: currentBelt, degrees: currentDegrees + 1 };
    }

    const currentIndex = BELT_PROGRESSION.indexOf(currentBelt);
    if (currentIndex === -1 || currentIndex === BELT_PROGRESSION.length - 1) {
        // Unknown belt or already at max
        return { belt: currentBelt, degrees: currentDegrees };
    }

    return {
        belt: BELT_PROGRESSION[currentIndex + 1],
        degrees: 0,
    };
}

describe('Belt Graduation Logic', () => {
    it('should add a degree when student has less than 4 degrees', () => {
        const result = calculateNextBelt(Belt.BRANCA, 2);
        expect(result.belt).toBe(Belt.BRANCA);
        expect(result.degrees).toBe(3);
    });

    it('should graduate to next belt when student has 4 degrees', () => {
        const result = calculateNextBelt(Belt.BRANCA, 4);
        expect(result.belt).toBe(Belt.CINZA_BRANCA);
        expect(result.degrees).toBe(0);
    });

    it('should progress through intermediate belts correctly', () => {
        const result = calculateNextBelt(Belt.AMARELA, 4);
        expect(result.belt).toBe(Belt.AMARELA_PRETA);
        expect(result.degrees).toBe(0);
    });

    it('should not graduate beyond red belt', () => {
        const result = calculateNextBelt(Belt.VERMELHA, 4);
        expect(result.belt).toBe(Belt.VERMELHA);
        expect(result.degrees).toBe(4);
    });

    it('should handle edge case of 0 degrees', () => {
        const result = calculateNextBelt(Belt.AZUL, 0);
        expect(result.belt).toBe(Belt.AZUL);
        expect(result.degrees).toBe(1);
    });
});
