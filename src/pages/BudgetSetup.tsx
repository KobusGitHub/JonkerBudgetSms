import React, { useEffect, useState } from 'react';
import { IonItem, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonIcon, IonText } from '@ionic/react';
import { calendarOutline, lockClosedOutline, timeOutline } from 'ionicons/icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { MONTHS } from '../shared/budgetPeriod';
import { currencyFormatter } from '../shared/utils';
import './BudgetSetup.css';

interface BudgetSetupProps {
  selectedYear: number;
  selectedMonth: string;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: string) => void;
  editable?: boolean;
}

const BudgetSetup: React.FC<BudgetSetupProps> = ({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange,
  editable = true
}) => {
    const { user, profile } = useAuth();
    const [spent, setSpent] = useState(0);
    const [isSpentLoaded, setIsSpentLoaded] = useState(false);

    // Generate years 2025 to 2035 dynamically
  const years = Array.from({ length: 11 }, (_, i) => 2025 + i);

  useEffect(() => {
    if (!user?.uid) {
      setSpent(0);
      setIsSpentLoaded(false);
      return;
    }

    const expenseQuery = query(
      collection(FIREBASE_DB, 'expense'),
      where('shareToken', '==', user.uid),
      where('month', '==', selectedMonth),
      where('year', '==', selectedYear)
    );

    return onSnapshot(expenseQuery, snapshot => {
      setSpent(snapshot.docs.reduce((total, expense) => total + (Number(expense.data().expenseValue) || 0), 0));
      setIsSpentLoaded(true);
    }, error => {
      console.error('Budget remainder fetch failed:', error);
      setIsSpentLoaded(true);
    });
  }, [selectedMonth, selectedYear, user?.uid]);

  const budgetLeft = profile && isSpentLoaded
    ? (Number(profile.budget) || 0) - spent
    : null;

  return (


    <IonGrid className={`ion-no-padding budget-period-bar ${editable ? 'budget-period-bar-editable' : 'budget-period-bar-readonly'}`}>
        <IonRow>
            {/* Year Column */}
            <IonCol size="6">
            <IonItem lines="none">
                {editable ? <>
                <IonIcon icon={calendarOutline} slot="start" />
                <IonSelect
                  value={selectedYear}
                  onIonChange={e => onYearChange?.(e.detail.value)}
                  style={{ fontSize: '12px', width: '100%', minHeight: '10px', paddingBottom: '10px' }}
                >
                  {years.map(year => (
                    <IonSelectOption key={year} value={year}>{year}</IonSelectOption>
                  ))}
                </IonSelect>
                </> : <div className='budget-period-readonly-field'>
                  <IonIcon icon={lockClosedOutline} />
                  <div>
                    <IonText className='budget-period-label'>YEAR</IonText>
                    <IonText className='budget-period-value'>{selectedYear}</IonText>
                  </div>
                </div>}
            </IonItem>
            </IonCol>

            {/* Month Column */}
            <IonCol size="6">
            <IonItem lines="none">
                {editable ? <>
                <IonIcon icon={timeOutline} slot="start" />
                <IonSelect
                  value={selectedMonth}
                  onIonChange={e => onMonthChange?.(e.detail.value)}
                  style={{ fontSize: '12px', width: '100%', minHeight: '10px', paddingBottom: '10px', '--justify-content': 'space-between' }}
                >
                  {MONTHS.map(month => (
                    <IonSelectOption key={month} value={month}>{month}</IonSelectOption>
                  ))}
                </IonSelect>
                </> : <div className='budget-period-readonly-field'>
                  <IonIcon icon={lockClosedOutline} />
                  <div>
                    <IonText className='budget-period-label'>MONTH</IonText>
                    <IonText className='budget-period-value'>{selectedMonth}</IonText>
                  </div>
                </div>}
            </IonItem>
            </IonCol>
        </IonRow>
        {!editable && <IonRow className='budget-period-remaining-row'>
          <IonCol>
            <IonText className='budget-period-label'>LEFT</IonText>
            <IonText className={`budget-period-value ${budgetLeft !== null && budgetLeft < 0 ? 'budget-period-value-negative' : ''}`}>
              {budgetLeft === null ? '...' : currencyFormatter.format(budgetLeft)}
            </IonText>
          </IonCol>
        </IonRow>}
        </IonGrid>
  );
};

export default BudgetSetup;
