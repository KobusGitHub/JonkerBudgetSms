import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonPage, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, useIonAlert, useIonToast, useIonViewWillEnter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { collection, doc, DocumentData, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { calculateBudgetLeft, currencyFormatter, sortCategories } from '../shared/utils';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { cardOutline, pencilOutline, timeOutline } from 'ionicons/icons';
import BudgetSetup from './BudgetSetup';

const TransferPage: React.FC = () => {

    const { user } = useAuth();
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [isCategoryLoaded, setIsCategoryLoaded] = useState(false);

    const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
    const [isExpensesLoaded, setIsExpensesLoaded] = useState(false);


    const [budgetYear, setBudgetYear] = useState(() => {
        const year = localStorage.getItem('budget_year');
        return year ? parseInt(year) : new Date().getFullYear();
    });

    const [budgetMonth, setBudgetMonth] = useState(() => {
        const month = localStorage.getItem('budget_month');
        return month ? month : new Date().toLocaleString('default', { month: 'long' });
    });


    const [fromCategory, setFromCategory] = useState<CategoryModel>();
    const [toCategory, setToCategory] = useState<CategoryModel>();
    const [fromFilteredExpenses, setFromFilteredExpenses] = useState<ExpenseModel[]>([]);
    const [toFilteredExpenses, setToFilteredExpenses] = useState<ExpenseModel[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    const [presentToast, dismissToast] = useIonToast();
    const [presentAlert] = useIonAlert();

    useIonViewWillEnter(() => {
            resetForm();
    });

    const resetForm = () => {
        setAmount(0);
        setComment('');
        setFromCategory(undefined);
        setToCategory(undefined);
        setFromFilteredExpenses([]);
        setToFilteredExpenses([]);
    }

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
    }, []);

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
    }, []);



    
    const saveExpense = () => {

        if (!fromCategory) {
            presentToast({ message: 'Please select a FROM category.', duration: 2000, color: 'warning' });
            return;
        }

        if (!toCategory) {
            presentToast({ message: 'Please select a TO category.', duration: 2000, color: 'warning' });
            return;
        }

        if (amount <= 0) {
            presentToast({ message: 'Please enter an amount greater than 0.', duration: 2000, color: 'warning' });
            return;
        }
        
        presentAlert({
            header: 'Confirm Expense',
            message: `Are you sure you want to transfer ${currencyFormatter.format(amount)} from ${fromCategory?.categoryName} to ${toCategory?.categoryName}?`,
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
                    let fromExp : ExpenseModel = {
                        categoryGuidId: fromCategory.guidId,
                        comment: comment,
                        expenseCode: crypto.randomUUID(),
                        expenseValue: amount * (-1),
                        guidId: '',
                        month: budgetMonth,
                        recordDate: myDate.toString(),
                        shareToken: user?.uid ?? '',
                        year: budgetYear
                    };
                    writeExpenseToFirebase(fromExp);

                    let toExp : ExpenseModel = {
                        categoryGuidId: toCategory.guidId,
                        comment: comment,
                        expenseCode: crypto.randomUUID(),
                        expenseValue: amount,
                        guidId: '',
                        month: budgetMonth,
                        recordDate: myDate.toString(),
                        shareToken: user?.uid ?? '',
                        year: budgetYear
                    };
                    writeExpenseToFirebase(toExp);

                    // RESET FORM
                    resetForm();
                }
            },
            ],
        });
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
                    <IonTitle>Transfer</IonTitle>
                </IonToolbar>

                <BudgetSetup 
                    selectedYear={budgetYear}
                    selectedMonth={budgetMonth}
                    onYearChange={(year) => {
                        localStorage.setItem('budget_year', year.toString());
                        setBudgetYear(year);
                    } }
                    onMonthChange={(month) => {
                        localStorage.setItem('budget_month', month);
                        setBudgetMonth(month);
                    } }
                />
            </IonHeader>
            <IonContent className="ion-padding">


  {             /* From Category Select */}
                <IonItem style={{paddingBottom: '10px'}}>
                    <IonSelect
                        labelPlacement="floating"
                        label="From Category"
                        placeholder="Select a From Category"
                        value={fromCategory?.guidId}
                        onIonChange={(e) => {
                            const selectedGuid = e.detail.value as string;
                            const selectedCategory = categories.find(c => c.guidId === selectedGuid);
                            if (selectedCategory) {
                                setFromCategory(selectedCategory);
                            
                                const fExp = getfilterExpenses(selectedCategory.guidId);
                                setFromFilteredExpenses(fExp);
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



                 {/* From Accordion */}
                <IonAccordionGroup className="ion-margin-bottom">
                    <IonAccordion value="history">
                        <IonItem slot="header" color="light" lines="full">
                        <IonIcon icon={timeOutline} slot="start" color="primary" />
                        <IonLabel>
                            <h2>From Category History</h2>
                            <p style={{ fontSize: '12px' }}>{fromFilteredExpenses.length} previous transactions</p>
                            
                            
                            {fromCategory && (() => {
                            // Calculate the value once
                            const budgetLeft = calculateBudgetLeft(fromCategory, fromFilteredExpenses);
                            const isOverspent = budgetLeft < 0;

                            return (
                                <p style={{ 
                                fontSize: '12px', 
                                color: isOverspent ? 'var(--ion-color-danger)' : 'var(--ion-color-secondary)',
                                fontWeight: isOverspent ? 'normal' : 'normal' // Optional: makes it pop more
                                }}>
                                {currencyFormatter.format(budgetLeft)} {isOverspent ? 'overspent' : 'left'} on {fromCategory.categoryName}
                                </p>
                            );
                            })()}

                        </IonLabel>
                        </IonItem>

                        <div slot="content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
                        {fromFilteredExpenses.length > 0 ? (fromFilteredExpenses.map((exp) => (
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




                {/* To Category Select */}
                <IonItem style={{paddingBottom: '10px'}}>
                    <IonSelect
                        labelPlacement="floating"
                        label="To Category"
                        placeholder="Select a To Category"
                        value={toCategory?.guidId}
                        onIonChange={(e) => {
                            const selectedGuid = e.detail.value as string;
                            const selectedCategory = categories.find(c => c.guidId === selectedGuid);
                            if (selectedCategory) {
                                setToCategory(selectedCategory);
                            
                                const fExp = getfilterExpenses(selectedCategory.guidId);
                                setToFilteredExpenses(fExp);
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

                {/* To Accordion */}
                <IonAccordionGroup className="ion-margin-bottom">
                    <IonAccordion value="history">
                        <IonItem slot="header" color="light" lines="full">
                        <IonIcon icon={timeOutline} slot="start" color="primary" />
                        <IonLabel>
                            <h2>Category History</h2>
                            <p style={{ fontSize: '12px' }}>{toFilteredExpenses.length} previous transactions</p>
                            
                            
                            {toCategory && (() => {
                            // Calculate the value once
                            const budgetLeft = calculateBudgetLeft(toCategory, toFilteredExpenses);
                            const isOverspent = budgetLeft < 0;

                            return (
                                <p style={{ 
                                fontSize: '12px', 
                                color: isOverspent ? 'var(--ion-color-danger)' : 'var(--ion-color-secondary)',
                                fontWeight: isOverspent ? 'normal' : 'normal' // Optional: makes it pop more
                                }}>
                                {currencyFormatter.format(budgetLeft)} {isOverspent ? 'overspent' : 'left'} on {toCategory.categoryName}
                                </p>
                            );
                            })()}

                        </IonLabel>
                        </IonItem>

                        <div slot="content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
                        {toFilteredExpenses.length > 0 ? (toFilteredExpenses.map((exp) => (
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
                        type="number" // Trigger numeric keypad
                        placeholder="0.00"
                        inputmode="decimal" // Allows for decimal point on mobile
                        value={amount} // Assumes you add 'amount' to your model
                        onIonInput={(e) => {
                            const val = e.detail.value;
                            setAmount(val ? parseFloat(val) : 0);// Convert string to number
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

            {/* <IonFooter style={{ height: '24px' }}>
                <IonToolbar>
                    <div style={{ paddingBottom:' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',  width: '100%', color: '#6b7dba' }}>
                    Jonker Budget Home
                    </div>
                </IonToolbar>
            </IonFooter> */}

              <IonFooter>
                <IonToolbar>
                    <IonGrid>
                    <IonRow>
                        <IonCol>
                        <IonButton expand='block' onClick={saveExpense}>
                            Save Expense
                        </IonButton>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <div style={{ paddingBottom:' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',  width: '100%', color: '#6b7dba' }}>
                        Jonker Budget Home
                        </div>
                        </IonCol>
                    </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonFooter>

        </IonPage>
    );
};

export default TransferPage;