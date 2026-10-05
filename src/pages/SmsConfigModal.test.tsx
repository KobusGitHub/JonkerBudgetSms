import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import SmsConfigModal from './SmsConfigModal';
import { SmsConfigModel } from '../models/SmsConfigModel';
import { CategoryModel } from '../models/CategoryModel';

vi.mock('@ionic/react', async () => {
  const ionic = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...ionic,
    IonModal: React.forwardRef(({ children }: { children?: React.ReactNode }, _ref) => <div>{children}</div>),
  };
});

const categories: CategoryModel[] = ['Food', 'Travel', 'Bills'].map(categoryName => ({
  guidId: categoryName.toLowerCase(), categoryName, budget: 0,
  isDeleted: false, isFavourite: false, shareToken: 'test-user',
}));
const smsConfigs: SmsConfigModel[] = [
  { guidId: 'food-config', categoryGuidId: 'food', categoryName: 'Food', searchPattern: 'GROCERY', isDeleted: false, shareToken: 'test-user' },
  { guidId: 'travel-config', categoryGuidId: 'travel', categoryName: 'Travel', searchPattern: 'PETROL', isDeleted: false, shareToken: 'test-user' },
];

const Editor = () => {
  const [smsConfig, setSmsConfig] = useState<SmsConfigModel>({
    guidId: '', categoryGuidId: '', categoryName: '', searchPattern: '', isDeleted: false, shareToken: '',
  });
  return <>
    <SmsConfigModal
      isOpen={false}
      modalRef={React.createRef<HTMLIonModalElement>()}
      categories={categories}
      smsConfigs={smsConfigs}
      smsConfig={smsConfig}
      setSmsConfig={setSmsConfig}
      onDismiss={vi.fn()}
    />
    <output data-testid="config-id">{smsConfig.guidId}</output>
    <output data-testid="pattern">{smsConfig.searchPattern}</output>
  </>;
};

const selectCategory = (container: HTMLElement, categoryGuidId: string) => {
  fireEvent(container.querySelector('ion-select')!, new CustomEvent('ionChange', {
    detail: { value: categoryGuidId }, bubbles: true,
  }));
};

test('selecting a configured category populates its pattern and update ID', () => {
  const { container } = render(<Editor />);
  selectCategory(container, 'food');

  expect(screen.getByTestId('pattern').textContent).toBe('GROCERY');
  expect(screen.getByTestId('config-id').textContent).toBe('food-config');

  selectCategory(container, 'travel');
  expect(screen.getByTestId('pattern').textContent).toBe('PETROL');
  expect(screen.getByTestId('config-id').textContent).toBe('travel-config');
});

test('switching to an unconfigured category clears the pattern and update ID', () => {
  const { container } = render(<Editor />);
  selectCategory(container, 'food');
  selectCategory(container, 'bills');

  expect(screen.getByTestId('pattern').textContent).toBe('');
  expect(screen.getByTestId('config-id').textContent).toBe('');
});

test('a repeated selection event does not overwrite edits to the current pattern', () => {
  const { container } = render(<Editor />);
  selectCategory(container, 'food');
  fireEvent(container.querySelector('ion-textarea')!, new CustomEvent('ionInput', {
    detail: { value: 'GROCERY|MARKET' }, bubbles: true,
  }));
  selectCategory(container, 'food');

  expect(screen.getByTestId('pattern').textContent).toBe('GROCERY|MARKET');
  expect(screen.getByTestId('config-id').textContent).toBe('food-config');
  expect(smsConfigs[0].searchPattern).toBe('GROCERY');
});