import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonPage, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, useIonAlert, useIonToast, useIonViewWillEnter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { collection, doc, DocumentData, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { calculateBudgetLeft, currencyFormatter, normalizeAmountInput, sortCategories } from '../shared/utils';
import { getConfiguredBudgetPeriod } from '../shared/budgetPeriod';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { cardOutline, pencilOutline, timeOutline } from 'ionicons/icons';
import BudgetSetup from './BudgetSetup';
import { AppFooterText } from '../components/AppFooter';

const ExpensePage: React.FC = () => {

    const { user } = useAuth();
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [isCategoryLoaded, setIsCategoryLoaded] = useState(false);

    const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
    const [isExpensesLoaded, setIsExpensesLoaded] = useState(false);


    const [configuredPeriod, setConfiguredPeriod] = useState(getConfiguredBudgetPeriod);
    const budgetYear = configuredPeriod.year;
    const budgetMonth = configuredPeriod.month;


    const [activeCategory, setActiveCategory] = useState<CategoryModel>();
    const [filteredExpenses, setFilteredExpenses] = useState<ExpenseModel[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [amountText, setAmountText] = useState<string>('');
    const [comment, setComment] = useState<string>('');

    const [presentToast, dismissToast] = useIonToast();
    const [presentAlert] = useIonAlert();


    useIonViewWillEnter(() => {
        resetForm();
        setConfiguredPeriod(getConfiguredBudgetPeriod());
    });
    
    // Categories
    useEffect(() => {

        const catCollection = collection(FIREBASE_DB, 'category');
        let catQuery = query(catCollection,
            where('isDeleted', '==', false), 
            where('shareToken', '==', user?.uid)
        );
        const unsubscribe = onSnapshot(catQuery, (queryShapshot: DocumentData) => {
            const categories = queryShapshot.docs.map((doc: DocumentData) => {
                return {
                    quidId: doc.id,
                    ...doc.data()
                }
            });

            const sortedCategories = sortCategories(categories);

            console.log('Categories Fetched: ', sortedCategories);
            setCategories(sortedCategories); 

            setIsCategoryLoaded(true);
            console.log('isCategoryLoaded set to true');
        });

        return unsubscribe;
    }, [user?.uid]);

    // Expenses
    useEffect(() => {

        const expCollection = collection(FIREBASE_DB, 'expense');
        let expQuery = query(expCollection,
            where('shareToken', '==', user?.uid),
            where('month', '==', budgetMonth),
            where('year', '==', budgetYear),
            orderBy('recordDate', 'desc')
        );
        const unsubscribe = onSnapshot(expQuery, (queryShapshot: DocumentData) => {
            const expenses = queryShapshot.docs.map((doc: DocumentData) => {
                return {
                    quidId: doc.id,
                    ...doc.data()
                }
            });

         
            console.log('Expenses Fetched: ', expenses);
            setExpenses(expenses); 

            setIsExpensesLoaded(true);
            console.log('isExpensesLoaded set to true');
        });

        return unsubscribe;
    }, [user?.uid, budgetMonth, budgetYear]);



    
    const saveExpense = () => {

        if (!activeCategory) {
            presentToast({ message: 'Please select a category.', duration: 2000, color: 'warning' });
            return;
        }

        
        
        presentAlert({
            header: amount < 0 ? 'Confirm Refund' : 'Confirm Expense',
            message: amount < 0
                ? `Record ${currencyFormatter.format(amount)} as money returned to ${activeCategory.categoryName}?`
                : `Record ${currencyFormatter.format(amount)} as an expense for ${activeCategory.categoryName}?`,
            buttons: [
            {
                text: 'Cancel',
                role: 'cancel',
            },
            {
                text: 'Confirm',
                role: 'confirm',
                handler: () => {

                    const myDate = new Date();
                    let exp : ExpenseModel = {
                        categoryGuidId: activeCategory.guidId,
                        comment: comment,
                        expenseCode: crypto.randomUUID(),
                        expenseValue: amount,
                        guidId: '',
                        month: budgetMonth,
                        recordDate: myDate.toString(),
                        shareToken: user?.uid ?? '',
                        year: budgetYear
                    };
  

                    writeExpenseToFirebase(exp);
                }
            },
            ],
        });
    }

    const resetForm = () => {
         setAmount(0);
        setAmountText('');
        setComment('');
        setActiveCategory(undefined);
        setFilteredExpenses([]);
    }
    
    const writeExpenseToFirebase = async (expenseModel: ExpenseModel) => {
        try{
            const smsExpenseCollection = collection(FIREBASE_DB, 'expense');
            const newDocRef = doc(smsExpenseCollection);
            
            let exp = {
                ...expenseModel,
                guidId: newDocRef.id,
            }
    
            console.log('Expense to save: ', exp);
            await setDoc(newDocRef, exp);

            presentToast({ 
                message: 'Expense saved successfully!', 
                duration: 2000, 
                color: 'success' 
            });

            // RESET FORM
            resetForm();

        } catch (error) {
            presentToast({ 
                message: 'Failed to save expense. Please try again.', 
                duration: 3000, 
                color: 'danger' 
            });
        }
    };

    const getfilterExpenses = (categoryGuidId: string) => {
        const filtered = expenses.filter(exp => exp.categoryGuidId === categoryGuidId).sort((a, b) => {
        const timeA = new Date(a.recordDate).getTime() || 0;
        const timeB = new Date(b.recordDate).getTime() || 0;
        return timeB - timeA;
        });
        console.log('Expenses Filted: ', filtered);
        return filtered;
    }


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Expense</IonTitle>
                </IonToolbar>

                <BudgetSetup 
                    selectedYear={budgetYear}
                    selectedMonth={budgetMonth}
                    editable={false}
                />

            </IonHeader>
            <IonContent className="ion-padding">

               


                {/* Category Select */}
                <IonItem style={{paddingBottom: '10px'}}>
                    <IonSelect
                        labelPlacement="floating"
                        label="Category"
                        placeholder="Select a Category"
                        value={activeCategory?.guidId}
                        onIonChange={(e) => {
                            const selectedGuid = e.detail.value as string;
                            const selectedCategory = categories.find(c => c.guidId === selectedGuid);
                            if (selectedCategory) {
                                setActiveCategory(selectedCategory);
                            
                                const fExp = getfilterExpenses(selectedCategory.guidId);
                                setFilteredExpenses(fExp);
                            }
                        }}
                        >
                        {categories.map((category) => (
                            <IonSelectOption key={category.guidId} value={category.guidId}>
                                {category.categoryName}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>

                {/* Accordion */}
                <IonAccordionGroup className="ion-margin-bottom">
                    <IonAccordion value="history">
                        <IonItem slot="header" color="light" lines="full">
                        <IonIcon icon={timeOutline} slot="start" color="primary" />
                        <IonLabel>
                            <h2>Category History</h2>
                            <p style={{ fontSize: '12px' }}>{filteredExpenses.length} previous transactions</p>
                            
                            
                            {activeCategory && (() => {
                            // Calculate the value once
                            const budgetLeft = calculateBudgetLeft(activeCategory, filteredExpenses);
                            const isOverspent = budgetLeft < 0;

                            return (
                                <p style={{ 
                                fontSize: '12px', 
                                color: isOverspent ? 'var(--ion-color-danger)' : 'var(--ion-color-secondary)',
                                fontWeight: isOverspent ? 'normal' : 'normal' // Optional: makes it pop more
                                }}>
                                {currencyFormatter.format(budgetLeft)} {isOverspent ? 'overspent' : 'left'} on {activeCategory.categoryName}
                                </p>
                            );
                            })()}

                        </IonLabel>
                        </IonItem>

                        <div slot="content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
                        {filteredExpenses.length > 0 ? (filteredExpenses.map((exp) => (
                            <IonItem lines="none" key={exp.guidId}>
                            
                            <IonGrid style={{ 'background': '#c3e1f0ff', borderRadius: '8px', marginBottom: '10px' }}>
                                <IonRow>
                                <IonCol size="12" style={{paddingTop: '0px', paddingBottom: '0px'}}>
                                    
                                    <IonLabel style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                                    <IonIcon icon={timeOutline} />
                                    {new Date(exp.recordDate).toLocaleString()}
                                    </IonLabel>

                                </IonCol>
                                </IonRow>
                                <IonRow>
                                <IonCol size="12" style={{paddingTop: '0px', paddingBottom: '0px'}}>
                                    <IonLabel style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                                    <IonIcon icon={cardOutline} />
                                    {currencyFormatter.format(exp.expenseValue)}
                                    </IonLabel>
                                </IonCol>
                                </IonRow>
                                <IonRow>
                                <IonCol size="12" style={{paddingTop: '0px', paddingBottom: '0px'}}>
                                    <IonLabel style={{ fontSize: '10px', display: 'flex', alignItems: 'flex-start', gap: '5px', opacity: 0.7, whiteSpace: 'normal', width: '100%', lineHeight: '1.4' }}>
                                    <IonIcon icon={pencilOutline} style={{ flexShrink: 0, marginTop: '2px' }} />
                
                                    <span>{exp.comment}</span>
                                    </IonLabel>
                                </IonCol>
                                </IonRow>
                            </IonGrid>

                            </IonItem>))
                        ): (
                            <IonItem lines="none">
                            <IonLabel color="medium" className="ion-text-center">No history for this category</IonLabel>
                            </IonItem>
                        )}
                        
                        </div>

                    </IonAccordion>
                </IonAccordionGroup>

                {/* Amount */}
                <IonItem>
                    <IonInput
                        label="Amount (R)"
                        labelPlacement="floating"
                        type="text" // type="number" rejects '.' or ',' depending on device locale
                        placeholder="0.00"
                        inputmode="decimal"
                        value={amountText}
                        onIonInput={(e) => {
                            const val = normalizeAmountInput(e.detail.value ?? '');
                            setAmountText(val);
                            const parsed = parseFloat(val);
                            setAmount(isNaN(parsed) ? 0 : parsed);
                        }}
                    />
                </IonItem>

                {/* Comment */}
                <IonItem style={{paddingBottom: '15px'}}>
                    <IonTextarea
                        labelPlacement="floating"
                        rows={3} // Initial height
                        label='Notes'
                        value={comment}
                        onIonInput={(e) => setComment(e.detail.value!)}
                        />
                </IonItem>

                {/* Save Button */}
                {/* <IonButton expand='block' onClick={saveExpense}>
                    Save Expense
                </IonButton>  */}


            </IonContent>

            <IonFooter>
                <IonToolbar>
                    <IonGrid className="ion-no-padding">
                    <IonRow>
                        <IonCol style={{ padding: '4px 8px 0' }}>
                        <IonButton expand='block' onClick={saveExpense} style={{ margin: 0 }}>
                            Save Expense
                        </IonButton> 
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <AppFooterText />
                        </IonCol>
                    </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonFooter>

        </IonPage>
    );
};

export default ExpensePage;