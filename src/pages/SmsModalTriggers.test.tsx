import React, { useEffect, useImperativeHandle, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import SmsConfigPage from './SmsConfigPage';
import SmsExpenseModal from './SmsExpenseModal';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'test-user' } }) }));
vi.mock('../config/FirebaseConfig', () => ({ FIREBASE_DB: {} }));
vi.mock('./BudgetSetup', () => ({ default: () => null }));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  query: (reference: unknown) => reference,
  where: () => ({}),
  orderBy: () => ({}),
  onSnapshot: (_reference: unknown, callback: (snapshot: { docs: unknown[] }) => void) => {
    callback({ docs: [] });
    return () => {};
  },
}));

vi.mock('@ionic/react', async () => {
  const ionic = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...ionic,
    IonModal: React.forwardRef(({ trigger, children }: { trigger?: string; children?: React.ReactNode }, ref) => {
      const [isOpen, setIsOpen] = useState(false);
      useImperativeHandle(ref, () => ({ present: () => setIsOpen(true) }));
      useEffect(() => {
        const triggerElement = trigger ? document.getElementById(trigger) : null;
        const present = () => setIsOpen(true);
        triggerElement?.addEventListener('click', present);
        return () => triggerElement?.removeEventListener('click', present);
      }, [trigger]);
      return isOpen ? <div role="dialog">{children}</div> : null;
    }),
  };
});

test('adding a category pattern does not open a retained SMS expense modal', () => {
  const expenseModalRef = React.createRef<HTMLIonModalElement>();
  const { container } = render(<>
    <SmsConfigPage />
    <SmsExpenseModal
      isOpen={false}
      modalRef={expenseModalRef}
      categories={[]}
      bankMessage={{
        id: '', sender: '', body: '', date: 0, messageType: '',
        categoryName: '', categoryGuidId: '', onlyMarkAsCompleted: false,
      }}
      setBankMessage={vi.fn()}
      onDismiss={vi.fn()}
      budgetYear={2026}
      budgetMonth="October"
    />
  </>);

  fireEvent.click(container.querySelector('#add-config')!);

  expect(screen.getByText('Add/Edit SMS Config')).toBeDefined();
  expect(screen.queryByText('Expense')).toBeNull();
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
});