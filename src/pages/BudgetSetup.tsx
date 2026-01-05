import React from 'react';
import { IonItem, IonSelect, IonSelectOption, IonList, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/react';
import { calendarOutline, timeOutline } from 'ionicons/icons';

interface BudgetSetupProps {
  selectedYear: number;
  selectedMonth: string;
  onYearChange: (year: number) => void;
  onMonthChange: (month: string) => void;
}

const BudgetSetup: React.FC<BudgetSetupProps> = ({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange 
}) => {

    // Generate years 2025 to 2035 dynamically
  const years = Array.from({ length: 11 }, (_, i) => 2025 + i);
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (

    
    <IonGrid className="ion-no-padding" style={{ 'background': '#1f364c', borderRadius: '8px' }}>
        <IonRow>
            {/* Year Column */}
            <IonCol size="6">
            <IonItem lines="none" style={{ minHeight: '10px', height: '35px', borderRadius: '8px', margin: '2px' }}>
                <IonIcon icon={calendarOutline} slot="start" style={{ fontSize: '14px', color: 'black', marginRight: '4px', paddingBottom: '10px' }} />
            
                <IonSelect 
                value={selectedYear}
                onIonChange={e => onYearChange(e.detail.value)}
                style={{ fontSize: '12px', width: '100%', minHeight: '10px', paddingBottom: '10px' }}
                >
                {years.map(year => (
                    <IonSelectOption key={year} value={year}>
                    {year}
                    </IonSelectOption>
                ))}
                </IonSelect>
            </IonItem>
            </IonCol>

            {/* Month Column */}
            <IonCol size="6">
            <IonItem lines="none"  style={{ minHeight: '10px', height: '35px', borderRadius: '8px', margin: '2px' }}>
                <IonIcon icon={timeOutline} slot="start" style={{ fontSize: '14px', color: 'black', marginRight: '4px', paddingBottom: '10px' }} />
            
                <IonSelect 
                  value={selectedMonth}
                  onIonChange={e => onMonthChange(e.detail.value)}
                  
                  style={{ fontSize: '12px', width: '100%', minHeight: '10px', paddingBottom: '10px', '--justify-content': 'space-between' }}
                  >
                    {months.map(month => (
                        <IonSelectOption key={month} value={month}>
                        {month}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
            </IonCol>
        </IonRow>
        </IonGrid>
  );
};

export default BudgetSetup;
