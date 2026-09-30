import { normalizeAmountInput } from './utils';

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