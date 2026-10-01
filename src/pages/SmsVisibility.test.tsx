import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { environment } from '../environments/environment';
import Home from './Home';
import Menu from './Menu';

vi.mock('./SmsExpensePage', () => ({ default: () => <div>SMS expense screen</div> }));
vi.mock('./SmsConfigPage', () => ({ default: () => <div>SMS config screen</div> }));

const CurrentPath = () => <span data-testid="current-path">{useLocation().pathname}</span>;

afterEach(() => {
  environment.smsEnabled = true;
});

test.each(['/app/sms-expense', '/app/sms-config'])('hides SMS navigation and redirects %s when disabled', (path) => {
  environment.smsEnabled = false;
  render(<MemoryRouter initialEntries={[path]}><Menu /><CurrentPath /></MemoryRouter>);

  expect(screen.getByTestId('current-path').textContent).toBe('/app/home');
  expect(screen.queryByText('SMS Expense')).toBeNull();
  expect(screen.queryByText('SMS Config')).toBeNull();
  expect(screen.queryByText('SMS expense screen')).toBeNull();
  expect(screen.queryByText('SMS config screen')).toBeNull();
});

test('hides SMS home shortcuts when disabled', () => {
  environment.smsEnabled = false;
  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(screen.queryByLabelText('SMS Expense')).toBeNull();
  expect(screen.queryByLabelText('SMS Config')).toBeNull();
});

test.each([
  ['/app/sms-expense', 'SMS expense screen'],
  ['/app/sms-config', 'SMS config screen'],
])('keeps %s available when enabled', (path, screenName) => {
  render(<MemoryRouter initialEntries={[path]}><Menu /></MemoryRouter>);
  expect(screen.getByText(screenName)).toBeDefined();
});

test('shows SMS navigation and home shortcuts when enabled', () => {
  const { unmount } = render(<MemoryRouter><Menu /></MemoryRouter>);
  expect(screen.getByText('SMS Expense')).toBeDefined();
  expect(screen.getByText('SMS Config')).toBeDefined();
  unmount();

  render(<MemoryRouter><Home /></MemoryRouter>);
  expect(screen.getByLabelText('SMS Expense')).toBeDefined();
  expect(screen.getByLabelText('SMS Config')).toBeDefined();
});