import { MessageModel } from '../models/MessageModel';

export const filterBankMessages = (messages: MessageModel[], savedIdentifiers: string[]): MessageModel[] => {
  const identifiers = savedIdentifiers
    .map(identifier => identifier.trim().toLowerCase())
    .filter(Boolean);

  return messages.filter(message =>
    identifiers.some(identifier => message.body.toLowerCase().includes(identifier))
  );
};