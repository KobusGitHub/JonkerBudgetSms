import { IonButton, IonButtons, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonNote, IonPage, IonProgressBar, IonRow, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { collection, DocumentData, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { currencyFormatter, sortCategories } from '../shared/utils';
import BudgetSetup from './BudgetSetup';

interface CategoryGroup {
    guidId: string;
    categoryName: string;
    spent: number;
    budget: number;
    remaining: number;
    count: number;
}

const AmountColumns: React.FC<{ spent: number; budget: number; remaining: number; bold?: boolean }> = ({ spent, budget, remaining, bold }) => {
    const weight = bold ? 600 : 400;
    const usage = budget > 0 ? spent / budget : (spent > 0 ? 1 : 0);
    const barColor = usage >= 1 ? 'danger' : usage >= 0.75 ? 'warning' : 'success';
    return (
        <IonGrid className='ion-no-padding' style={{ marginTop: '4px' }}>
            <IonRow className='ion-align-items-center' style={{ marginBottom: '6px' }}>
                <IonCol>
                    <IonProgressBar value={Math.min(usage, 1)} color={barColor} style={{ height: '8px', borderRadius: '4px' }} />
                </IonCol>
                <IonCol size='auto' style={{ fontSize: '11px', paddingLeft: '8px', minWidth: '40px', textAlign: 'right' }}>
                    <IonText color={barColor}>{budget > 0 ? `${Math.round(usage * 100)}%` : spent > 0 ? '>100%' : '0%'}</IonText>
                </IonCol>
            </IonRow>
            <IonRow style={{ fontSize: '11px', color: 'var(--ion-color-medium)' }}>
                <IonCol>Spent</IonCol>
                <IonCol>Budget</IonCol>
                <IonCol className='ion-text-end'>Remaining</IonCol>
            </IonRow>
            <IonRow style={{ fontSize: '13px', fontWeight: weight }}>
                <IonCol>{currencyFormatter.format(spent)}</IonCol>
                <IonCol>{currencyFormatter.format(budget)}</IonCol>
                <IonCol className='ion-text-end'>
                    <IonText color={remaining < 0 ? 'danger' : 'success'}>
                        {currencyFormatter.format(remaining)}
                    </IonText>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

const CategoryGroupReportPage: React.FC = () => {
    const { user } = useAuth();

    const [year, setYear] = useState(() => {
        const stored = localStorage.getItem('budget_year');
        return stored ? parseInt(stored) : new Date().getFullYear();
    });
    const [month, setMonth] = useState(() =>
        localStorage.getItem('budget_month') ?? new Date().toLocaleString('default', { month: 'long' })
    );

    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | null>(null);

    // Includes deleted categories so older expenses still group under a name
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(FIREBASE_DB, 'category'), where('shareToken', '==', user.uid));
        return onSnapshot(q, (snapshot: DocumentData) => {
            const cats = snapshot.docs.map((d: DocumentData) => ({ guidId: d.id, ...d.data() }));
            setCategories(sortCategories(cats));
        });
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;

        setIsLoading(true);
        const q = query(collection(FIREBASE_DB, 'expense'),
            where('shareToken', '==', user.uid),
            where('month', '==', month),
            where('year', '==', year)
        );

        return onSnapshot(q, (snapshot: DocumentData) => {
            setExpenses(snapshot.docs.map((d: DocumentData) => ({ guidId: d.id, ...d.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error('Category group report fetch failed:', error);
            setIsLoading(false);
        });
    }, [user?.uid, month, year]);

    const groups = useMemo<CategoryGroup[]>(() => {
        const spentByCategory = new Map<string, { spent: number; count: number }>();
        expenses.forEach(e => {
            const current = spentByCategory.get(e.categoryGuidId) ?? { spent: 0, count: 0 };
            current.spent += Number(e.expenseValue) || 0;
            current.count += 1;
            spentByCategory.set(e.categoryGuidId, current);
        });

        // Active categories always show; deleted ones only when they have expenses this month
        const rows: CategoryGroup[] = categories
            .filter(c => !c.isDeleted || spentByCategory.has(c.guidId))
            .map(c => {
                const { spent, count } = spentByCategory.get(c.guidId) ?? { spent: 0, count: 0 };
                const budget = Number(c.budget) || 0;
                return { guidId: c.guidId, categoryName: c.categoryName, spent, budget, remaining: budget - spent, count };
            });

        const knownIds = new Set(categories.map(c => c.guidId));
        spentByCategory.forEach(({ spent, count }, guidId) => {
            if (!knownIds.has(guidId)) {
                rows.push({ guidId, categoryName: 'Unknown category', spent, budget: 0, remaining: -spent, count });
            }
        });

        return rows;
    }, [categories, expenses]);

    const totals = groups.reduce(
        (acc, g) => ({ spent: acc.spent + g.spent, budget: acc.budget + g.budget, remaining: acc.remaining + g.remaining }),
        { spent: 0, budget: 0, remaining: 0 }
    );

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Category Group Report</IonTitle>
                </IonToolbar>

                <BudgetSetup
                    selectedYear={year}
                    selectedMonth={month}
                    onYearChange={setYear}
                    onMonthChange={setMonth}
                />
            </IonHeader>

            <IonContent className='ion-padding'>
                <IonItem
                    lines='none'
                    style={{
                        '--background': 'rgba(var(--ion-color-primary-rgb), 0.08)',
                        borderLeft: '4px solid var(--ion-color-primary)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)'
                    }}
                >
                    <IonLabel>
                        <strong style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ion-color-primary)' }}>Total</strong>
                        <AmountColumns {...totals} bold />
                    </IonLabel>
                </IonItem>

                {isLoading ? (
                    <div className='ion-text-center ion-padding'><IonSpinner /></div>
                ) : groups.length === 0 ? (
                    <IonText color='medium'>
                        <p className='ion-text-center'>No categories or expenses for {month} {year}</p>
                    </IonText>
                ) : (
                    <IonList>
                        {groups.map(g => (
                            <IonItem key={g.guidId} button detail onClick={() => setSelectedGroup(g)}>
                                <IonLabel>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <h2 style={{ margin: 0 }}>{g.categoryName}</h2>
                                        <span style={{ fontSize: '11px', color: 'var(--ion-color-medium)' }}>
                                            {g.count} transaction{g.count === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    <AmountColumns spent={g.spent} budget={g.budget} remaining={g.remaining} />
                                </IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                )}
            </IonContent>

            <IonModal isOpen={selectedGroup !== null} onDidDismiss={() => setSelectedGroup(null)}>
                <IonHeader>
                    <IonToolbar color='primary'>
                        <IonTitle>{selectedGroup?.categoryName ?? 'Transactions'}</IonTitle>
                        <IonButtons slot='end'>
                            <IonButton onClick={() => setSelectedGroup(null)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className='ion-padding'>
                    {selectedGroup && (
                        <>
                            <IonText color='medium'>
                                <p>{selectedGroup.count} transaction{selectedGroup.count === 1 ? '' : 's'} in {month} {year}</p>
                            </IonText>
                            <IonList>
                                {expenses
                                    .filter(expense => expense.categoryGuidId === selectedGroup.guidId)
                                    .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
                                    .map(expense => {
                                        const amount = Number(expense.expenseValue) || 0;
                                        return (
                                            <IonItem key={expense.guidId} lines='full'>
                                                <IonLabel style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {expense.comment && <h2 style={{ margin: 0, whiteSpace: 'normal' }}>{expense.comment}</h2>}
                                                    <IonNote>
                                                        {new Date(expense.recordDate).toLocaleString()}
                                                    </IonNote>
                                                </IonLabel>
                                                <IonText slot='end' color={amount < 0 ? 'success' : 'dark'}>
                                                    {currencyFormatter.format(amount)}
                                                </IonText>
                                            </IonItem>
                                        );
                                    })}
                            </IonList>
                        </>
                    )}
                </IonContent>
            </IonModal>

            <IonFooter style={{ height: '24px' }}>
                <IonToolbar>
                    <div style={{ paddingBottom: ' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', color: '#6b7dba' }}>
                        Home Budget
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default CategoryGroupReportPage;
