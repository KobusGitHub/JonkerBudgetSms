import { IonButtons, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonSpinner, IonText, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { collection, DocumentData, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { currencyFormatter, sortCategories } from '../shared/utils';
import BudgetSetup from './BudgetSetup';
import { getConfiguredBudgetPeriod } from '../shared/budgetPeriod';
import AppFooter from '../components/AppFooter';

interface ForecastLine {
    guidId: string;
    categoryName: string;
    budget: number;
    spent: number;
    remaining: number;
}

const summaryStyle: React.CSSProperties = {
    '--background': 'rgba(var(--ion-color-primary-rgb), 0.08)',
    borderLeft: '4px solid var(--ion-color-primary)',
    borderRadius: '8px',
    marginBottom: '12px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 10
} as React.CSSProperties;

const SummaryRow: React.FC<{ label: string; value: number; color?: string; bold?: boolean }> = ({ label, value, color, bold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? '15px' : '13px', fontWeight: bold ? 600 : 400, marginTop: '4px' }}>
        <span>{label}</span>
        <IonText color={color}>{currencyFormatter.format(value)}</IonText>
    </div>
);

const ForecastPage: React.FC = () => {
    const { user } = useAuth();

    const [configuredPeriod, setConfiguredPeriod] = useState(getConfiguredBudgetPeriod);
    const year = configuredPeriod.year;
    const month = configuredPeriod.month;

    useIonViewWillEnter(() => setConfiguredPeriod(getConfiguredBudgetPeriod()));

    const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unchecked, setUnchecked] = useState<Set<string>>(new Set());

    // Several user records can share a shareToken, so match on the logged-in email first
    useEffect(() => {
        if (!user?.uid) return;

        const loadUserBudget = async () => {
            const userCollection = collection(FIREBASE_DB, 'user');
            let snapshot = user.email
                ? await getDocs(query(userCollection, where('email', '==', user.email), limit(1)))
                : null;

            if (!snapshot || snapshot.empty) {
                snapshot = await getDocs(query(userCollection, where('shareToken', '==', user.uid), limit(1)));
            }

            setMonthlyBudget(snapshot.empty ? 0 : Number(snapshot.docs[0].data().budget) || 0);
        };

        loadUserBudget().catch(error => {
            console.error('User budget fetch failed:', error);
            setMonthlyBudget(0);
        });
    }, [user?.uid, user?.email]);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(FIREBASE_DB, 'category'),
            where('isDeleted', '==', false),
            where('shareToken', '==', user.uid)
        );
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
            console.error('Forecast expense fetch failed:', error);
            setIsLoading(false);
        });
    }, [user?.uid, month, year]);

    const lines = useMemo<ForecastLine[]>(() => {
        const spentByCategory = new Map<string, number>();
        expenses.forEach(e => {
            spentByCategory.set(e.categoryGuidId, (spentByCategory.get(e.categoryGuidId) ?? 0) + (Number(e.expenseValue) || 0));
        });

        return categories.map(c => {
            const budget = Number(c.budget) || 0;
            const spent = spentByCategory.get(c.guidId) ?? 0;
            return { guidId: c.guidId, categoryName: c.categoryName, budget, spent, remaining: budget - spent };
        });
    }, [categories, expenses]);

    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.expenseValue) || 0), 0);
    // Overspent categories have nothing left to use, so only positive remainders count
    const plannedSpend = lines
        .filter(l => !unchecked.has(l.guidId))
        .reduce((sum, l) => sum + Math.max(l.remaining, 0), 0);
    const budget = monthlyBudget ?? 0;
    const currentLeft = budget - totalSpent;
    const forecastLeft = currentLeft - plannedSpend;

    const toggleLine = (guidId: string) => {
        setUnchecked(prev => {
            const next = new Set(prev);
            if (next.has(guidId)) next.delete(guidId); else next.add(guidId);
            return next;
        });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Forecast</IonTitle>
                </IonToolbar>

                <BudgetSetup
                    selectedYear={year}
                    selectedMonth={month}
                    editable={false}
                />
            </IonHeader>

            <IonContent className='ion-padding'>
                <IonItem className='budget-summary-panel' lines='none' style={summaryStyle}>
                    <IonLabel>
                        <strong style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ion-color-primary)' }}>Forecast</strong>
                        <SummaryRow label='Monthly budget' value={budget} />
                        <SummaryRow label='Spent so far' value={totalSpent} />
                        <SummaryRow label='Left now' value={currentLeft} color={currentLeft < 0 ? 'danger' : undefined} />
                        <SummaryRow label='Selected left-over budget' value={plannedSpend} color='warning' />
                        <div style={{ borderTop: '1px solid var(--ion-color-light-shade)', marginTop: '6px', paddingTop: '2px' }}>
                            <SummaryRow label='Forecast left' value={forecastLeft} color={forecastLeft < 0 ? 'danger' : 'success'} bold />
                        </div>
                    </IonLabel>
                </IonItem>

                {isLoading || monthlyBudget === null ? (
                    <div className='ion-text-center ion-padding'><IonSpinner /></div>
                ) : (
                    <IonList>
                        {lines.map(l => {
                            const checked = !unchecked.has(l.guidId);
                            return (
                                <IonItem key={l.guidId} button detail={false} onClick={() => toggleLine(l.guidId)}>
                                    <IonCheckbox slot='start' checked={checked} style={{ pointerEvents: 'none' }} aria-label={`Include ${l.categoryName}`} />
                                    <IonLabel>
                                        <h2 style={{ margin: 0 }}>{l.categoryName}</h2>
                                        <p style={{ margin: '2px 0 0', fontSize: '11px' }}>
                                            Budget {currencyFormatter.format(l.budget)} · Spent {currencyFormatter.format(l.spent)}
                                        </p>
                                    </IonLabel>
                                    <IonText slot='end' color={l.remaining < 0 ? 'danger' : checked ? 'dark' : 'medium'}>
                                        {currencyFormatter.format(l.remaining)}
                                    </IonText>
                                </IonItem>
                            );
                        })}
                    </IonList>
                )}
            </IonContent>

            <AppFooter />
        </IonPage>
    );
};

export default ForecastPage;
