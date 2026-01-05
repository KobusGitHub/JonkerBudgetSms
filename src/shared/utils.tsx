import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';


export const sortCategories = (categories: CategoryModel[]): CategoryModel[] => {
    return [...categories].sort((a: any, b: any) => {
          // 1. Primary Sort: isFavourite (true first)
          // In JS, true (1) comes after false (0), so we subtract b from a for descending
          const favA = a.isFavourite ? 1 : 0;
          const favB = b.isFavourite ? 1 : 0;

          if (favA !== favB) {
            return favB - favA; // High value (1/true) moves to the top
          }

          // 2. Secondary Sort: categoryName (Alphabetical)
          // This only runs if both items have the same 'isFavourite' status
          const nameA = a.categoryName?.toLowerCase() || '';
          const nameB = b.categoryName?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
};



export const currencyFormatter = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
});

export const calculateBudgetLeft = (category: CategoryModel, catExpenses: ExpenseModel[]) => {
    const expenseTotal = catExpenses.reduce((accumulator, currentExp) => {
        return accumulator + currentExp.expenseValue;
    }, 0);


    const budLeft = category?.budget - expenseTotal;

    console.log('Budget: ' + category?.budget);
    console.log('expenseTotal: ' + expenseTotal);

    return budLeft
}

