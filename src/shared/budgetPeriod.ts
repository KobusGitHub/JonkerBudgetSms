export const BUDGET_YEAR_KEY = 'budget_year';
export const BUDGET_MONTH_KEY = 'budget_month';

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export interface BudgetPeriod {
    year: number;
    month: string;
}

export const getConfiguredBudgetPeriod = (): BudgetPeriod => {
    const storedYear = localStorage.getItem(BUDGET_YEAR_KEY);
    const storedMonth = localStorage.getItem(BUDGET_MONTH_KEY);

    return {
        year: storedYear ? parseInt(storedYear, 10) : new Date().getFullYear(),
        month: storedMonth ?? MONTHS[new Date().getMonth()]
    };
};

export const saveConfiguredBudgetPeriod = ({ year, month }: BudgetPeriod) => {
    localStorage.setItem(BUDGET_YEAR_KEY, year.toString());
    localStorage.setItem(BUDGET_MONTH_KEY, month);
    window.dispatchEvent(new Event('budget-period-changed'));
};