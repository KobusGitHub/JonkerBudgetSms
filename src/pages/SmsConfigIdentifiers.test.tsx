import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { deleteDoc, setDoc } from 'firebase/firestore';
import SmsConfigPage from './SmsConfigPage';

const saveIdentifier = vi.mocked(setDoc);
const removeIdentifier = vi.mocked(deleteDoc);

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'test-user' } }) }));
vi.mock('../config/FirebaseConfig', () => ({ FIREBASE_DB: {} }));
vi.mock('./SmsConfigModal', () => ({ default: () => null }));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  query: (reference: unknown) => reference,
  where: () => ({}),
  onSnapshot: (reference: { name: string }, callback: (snapshot: { docs: unknown[] }) => void) => {
    callback({ docs: reference.name === 'smsIdentifier' ? [{ id: 'saved-id', data: () => ({ identifier: 'Saved bank:', shareToken: 'test-user' }) }] : [] });
    return () => {};
  },
  doc: (reference: { name?: string }, id?: string, documentId?: string) => ({ path: documentId ? id : reference.name, id: documentId ?? id ?? 'new-id' }),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

beforeEach(() => {
  saveIdentifier.mockReset().mockResolvedValue(undefined);
  removeIdentifier.mockReset().mockResolvedValue(undefined);
});

test('saves a new identifier in its own user-scoped collection', async () => {
  const { container } = render(<SmsConfigPage />);
  expect(screen.queryByText('Absa: CCRD7037')).toBeNull();
  expect(screen.queryByText('Built-in')).toBeNull();
  fireEvent(container.querySelector('ion-input[label="New identifier"]')!, new CustomEvent('ionInput', { detail: { value: '  New Bank: ' }, bubbles: true }));
  fireEvent.click(screen.getByLabelText('Add identifier'));

  await waitFor(() => expect(saveIdentifier).toHaveBeenCalledWith(
    { path: 'smsIdentifier', id: 'new-id' },
    { guidId: 'new-id', identifier: 'New Bank:', shareToken: 'test-user' }
  ));
});

test('allows saving a formerly built-in identifier', async () => {
  const { container } = render(<SmsConfigPage />);
  fireEvent(container.querySelector('ion-input[label="New identifier"]')!, new CustomEvent('ionInput', { detail: { value: 'absa: ccrd7037' }, bubbles: true }));
  fireEvent.click(screen.getByLabelText('Add identifier'));

  await waitFor(() => expect(saveIdentifier).toHaveBeenCalledWith(
    { path: 'smsIdentifier', id: 'new-id' },
    { guidId: 'new-id', identifier: 'absa: ccrd7037', shareToken: 'test-user' }
  ));
});

test('does not save a duplicate of an existing account identifier', async () => {
  const { container } = render(<SmsConfigPage />);
  fireEvent(container.querySelector('ion-input[label="New identifier"]')!, new CustomEvent('ionInput', { detail: { value: 'saved BANK:' }, bubbles: true }));
  fireEvent.click(screen.getByLabelText('Add identifier'));

  expect(saveIdentifier).not.toHaveBeenCalled();
});

test('removes a saved identifier from the separate collection', async () => {
  render(<SmsConfigPage />);
  fireEvent.click(screen.getByLabelText('Remove Saved bank:'));

  await waitFor(() => expect(removeIdentifier).toHaveBeenCalledWith({ path: 'smsIdentifier', id: 'saved-id' }));
});