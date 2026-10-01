import { expect, test } from 'vitest';
import { MessageModel } from '../models/MessageModel';
import { filterBankMessages } from './smsIdentifiers';

const messages = [
  { id: '1', body: 'Absa: CCRD7037 purchase' },
  { id: '2', body: 'New bank: payment received' },
  { id: '3', body: 'Your delivery is arriving' },
] as MessageModel[];

const mockIdentifiers = ['Absa: CCRD7037', 'Absa: CCRD7029', 'Absa: CHEQ6406'];

test('matches only saved identifiers regardless of case', () => {
  expect(filterBankMessages(messages, [' new BANK: ', '  ']).map(message => message.id)).toEqual(['2']);
  expect(filterBankMessages(messages, mockIdentifiers).map(message => message.id)).toEqual(['1']);
});

test('matches no messages when the account has no identifiers', () => {
  expect(filterBankMessages(messages, []).map(message => message.id)).toEqual([]);
  expect(filterBankMessages(messages, ['  ']).map(message => message.id)).toEqual([]);
});