import { describe, expect, it } from 'vitest';
import { normalizeAmountInput, toggleAmountSign } from './utils';

describe('normalizeAmountInput', () => {
    it('preserves a leading negative sign', () => {
        expect(normalizeAmountInput('-12.50')).toBe('-12.50');
    });

    it('converts a decimal comma and preserves the negative sign', () => {
        expect(normalizeAmountInput('-12,50')).toBe('-12.50');
    });

    it('keeps an unfinished negative value editable', () => {
        expect(normalizeAmountInput('-')).toBe('-');
    });

    it('does not allow a minus sign after the first character', () => {
        expect(normalizeAmountInput('12-50')).toBe('1250');
    });
});

describe('toggleAmountSign', () => {
    it('adds a minus sign even when the amount is empty', () => {
        expect(toggleAmountSign('')).toBe('-');
    });

    it('reverses the sign without changing decimal digits', () => {
        expect(toggleAmountSign('12.50')).toBe('-12.50');
        expect(toggleAmountSign('-12.50')).toBe('12.50');
    });

    it('removes an unfinished minus sign', () => {
        expect(toggleAmountSign('-')).toBe('');
    });
});