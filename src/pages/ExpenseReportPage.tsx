import { IonButtons, IonContent, IonFooter, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonPage, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { collection, DocumentData, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { currencyFormatter } from '../shared/utils';
import BudgetSetup from './BudgetSetup';

const ExpenseReportPage: React.FC = () => {
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

    // Includes deleted categories so older expenses still show a name
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(FIREBASE_DB, 'category'), where('shareToken', '==', user.uid));
        return onSnapshot(q, (snapshot: DocumentData) => {
            setCategories(snapshot.docs.map((d: DocumentData) => ({ guidId: d.id, ...d.data() })));
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
            const rows: ExpenseModel[] = snapshot.docs.map((d: DocumentData) => ({ guidId: d.id, ...d.data() }));
            rows.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
            setExpenses(rows);
            setIsLoading(false);
        }, (error) => {
            console.error('Expense report fetch failed:', error);
            setIsLoading(false);
        });
    }, [user?.uid, month, year]);

    const categoryNames = useMemo(
        () => new Map(categories.map(c => [c.guidId, c.categoryName])),
        [categories]
    );

    const total = expenses.reduce((sum, e) => sum + (Number(e.expenseValue) || 0), 0);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Expense Report</IonTitle>
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
                        <p>{expenses.length} transaction{expenses.length === 1 ? '' : 's'}</p>
                    </IonLabel>
                    <IonText slot='end' color='primary'>
                        <strong>{currencyFormatter.format(total)}</strong>
                    </IonText>
                </IonItem>

                {isLoading ? (
                    <div className='ion-text-center ion-padding'><IonSpinner /></div>
                ) : expenses.length === 0 ? (
                    <IonText color='medium'>
                        <p className='ion-text-center'>No transactions for {month} {year}</p>
                    </IonText>
                ) : (
                    <IonList>
                        {expenses.map(exp => (
                            <IonItem key={exp.guidId}>
                                <IonLabel style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h2 style={{ margin: 0 }}>{categoryNames.get(exp.categoryGuidId) ?? 'Unknown category'}</h2>
                                    {exp.comment && <p style={{ margin: 0, fontSize: '12px', whiteSpace: 'normal', overflow: 'visible', overflowWrap: 'anywhere' }}>{exp.comment}</p>}
                                    <IonNote style={{ fontSize: '11px', color: '#000' }}>
                                        {new Date(exp.recordDate).toLocaleString()}
                                    </IonNote>
                                </IonLabel>
                                <IonText slot='end' color={exp.expenseValue < 0 ? 'success' : 'dark'}>
                                    {currencyFormatter.format(Number(exp.expenseValue) || 0)}
                                </IonText>
                            </IonItem>
                        ))}
                    </IonList>
                )}
            </IonContent>

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

export default ExpenseReportPage;
