import { IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonPage, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, useIonToast } from '@ionic/react';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { walletOutline } from 'ionicons/icons';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import './BudgetSetupPage.css';
import { getConfiguredBudgetPeriod, MONTHS, saveConfiguredBudgetPeriod } from '../shared/budgetPeriod';

const BudgetSetupPage: React.FC = () => {
    const { profile } = useAuth();
    const [presentToast] = useIonToast();
    const [budget, setBudget] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [period, setPeriod] = useState(getConfiguredBudgetPeriod);

    useEffect(() => {
        if (profile) {
            setBudget(String(profile.budget ?? 0));
        }
    }, [profile]);

    const saveBudget = async () => {
        if (!profile?.guidId) return;

        const amount = Number(budget);
        if (!Number.isFinite(amount) || amount < 0) {
            presentToast({ message: 'Enter a valid budget amount', duration: 2000, color: 'danger' });
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(doc(FIREBASE_DB, 'user', profile.guidId), { budget: amount });
            saveConfiguredBudgetPeriod(period);
            presentToast({ message: 'Budget setup saved successfully', duration: 2000, color: 'success' });
        } catch (error) {
            console.error('Budget save failed:', error);
            presentToast({ message: 'Failed to save budget', duration: 2000, color: 'danger' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color='primary'>
                    <IonButtons slot='start'>
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Budget Setup</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className='ion-padding budget-setup-content'>
                <div className='budget-setup-card'>
                    <IonIcon className='budget-setup-icon' icon={walletOutline} color='primary' />
                    <h1>Monthly Budget</h1>
                    <p>Set the amount and period used throughout your budget.</p>

                    <IonItem className='budget-input' fill='outline'>
                        <IonLabel position='stacked'>Budget amount</IonLabel>
                        <IonInput
                            type='number'
                            min='0'
                            inputmode='decimal'
                            value={budget}
                            onIonInput={event => setBudget(event.detail.value ?? '')}
                        />
                    </IonItem>

                    <div className='budget-period-section'>
                        <h2>Budget period</h2>
                        <p>The amount is saved to the database. The period is saved locally on this device.</p>
                        <IonItem fill='outline' className='budget-period-input'>
                            <IonLabel position='stacked'>Year</IonLabel>
                            <IonSelect value={period.year} onIonChange={event => setPeriod(current => ({ ...current, year: Number(event.detail.value) }))}>
                                {Array.from({ length: 11 }, (_, index) => 2025 + index).map(year => (
                                    <IonSelectOption key={year} value={year}>{year}</IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonItem>
                        <IonItem fill='outline' className='budget-period-input'>
                            <IonLabel position='stacked'>Month</IonLabel>
                            <IonSelect value={period.month} onIonChange={event => setPeriod(current => ({ ...current, month: event.detail.value }))}>
                                {MONTHS.map(month => <IonSelectOption key={month} value={month}>{month}</IonSelectOption>)}
                            </IonSelect>
                        </IonItem>
                    </div>

                    <IonButton expand='block' onClick={saveBudget} disabled={isSaving || !profile}>
                        {isSaving ? 'Saving...' : 'Save Budget Setup'}
                    </IonButton>
                </div>

                <IonItem className='share-token-item' lines='none'>
                    <IonLabel>
                        <IonText color='medium'>Share token</IonText>
                        <p>{profile?.shareToken ?? 'Loading...'}</p>
                    </IonLabel>
                </IonItem>
            </IonContent>

            <IonFooter style={{ height: '24px' }}>
                <IonToolbar>
                    <div className='app-footer-label'>Home Budget</div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default BudgetSetupPage;