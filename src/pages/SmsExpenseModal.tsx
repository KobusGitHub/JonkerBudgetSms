import React, { useEffect, useState } from 'react';
import { 
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonTitle, IonContent, IonItem, IonInput, 
  IonSelect, IonSelectOption, 
  IonGrid,
  IonRow,
  IonCol,
  IonTextarea,
  IonLabel,
  IonAccordionGroup,
  IonAccordion,
  useIonAlert,
  useIonToast,
  IonFooter
} from '@ionic/react';
import { cardOutline, cashOutline, closeOutline, pencilOutline, timeOutline } from 'ionicons/icons';
import { CategoryModel } from '../models/CategoryModel';
import { MessageModel } from '../models/MessageModel';
import { SmsExpenseModel } from '../models/SmsExpenseModel';
import { collection, DocumentData, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { ExpenseModel } from '../models/ExpenseModel';
import BudgetSetup from './BudgetSetup';
import { calculateBudgetLeft, currencyFormatter } from '../shared/utils';

interface Props {
  isOpen: boolean; // Control visibility from parent if not using trigger
  modalRef: React.RefObject<HTMLIonModalElement>;
  categories: CategoryModel[];
  bankMessage: MessageModel;
  setBankMessage: React.Dispatch<React.SetStateAction<MessageModel>>;
  onDismiss: (event: CustomEvent) => void;

  budgetYear: number;
  budgetMonth: string;
}

const SmsExpenseModal: React.FC<Props> = ({ 
  modalRef, 
  categories,
  bankMessage,
  setBankMessage,
  onDismiss,

  budgetYear,
  budgetMonth
}) => {

  const { user } = useAuth(); 
    
  const [selectedCategory, setSelectedCategory] = useState<CategoryModel>();

  const [amount, setAmount] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [expenseCatHistory, setExpenseCatHistory] = useState<ExpenseModel[]>([]);

 const [presentToast, dismissToast] = useIonToast();
  const [presentAlert] = useIonAlert();


  

  useEffect(() => {

    if(bankMessage.categoryGuidId){
      const localSelectedCategory = categories.find(c => c.guidId === bankMessage.categoryGuidId);
      if (localSelectedCategory) {
        setSelectedCategory(localSelectedCategory);
      }
    } else {
      setSelectedCategory(undefined);
    }


    if (bankMessage?.body) {
      const extracted = extractAmount(bankMessage.body);
      setAmount(extracted);
      setComment('');
     
      const fExp = getfilterExpenses(bankMessage.categoryGuidId || '');
      setExpenseCatHistory(fExp);

    }

    
  }, [bankMessage]); // Runs whenever the message changes



  /* EXPENSES */
  useEffect(() => {

    if (!user?.uid) return;

    // 1. Clear current list to prevent showing "old" month data while loading
    setExpenses([]);


    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


    const expenseCollection = collection(FIREBASE_DB, 'expense');
    var q = query(expenseCollection, 
      where('shareToken', '==', user?.uid),
      where('month', '==', budgetMonth),
      where('year', '==', budgetYear),
      orderBy('recordDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {
      const expenses = querySnapshot.docs.map((doc: DocumentData) => {
        return {
          guidId: doc.id,
          ...doc.data()
        }
      });

      console.log('Expenses Fetched: ', expenses);
      setExpenses(expenses); 
      
      const fExp = getfilterExpenses(bankMessage.categoryGuidId || '');
      setExpenseCatHistory(fExp);
    });

    return unsubscribe;
      

  }, [budgetYear, budgetMonth, bankMessage, user?.uid]);


  
  

  const getfilterExpenses = (categoryGuidId: string) => {
    const filtered = expenses.filter(exp => exp.categoryGuidId === categoryGuidId).sort((a, b) => {
      // 1. Convert to time (ms). Handle potential undefined with || 0
      const timeA = new Date(a.recordDate).getTime() || 0;
      const timeB = new Date(b.recordDate).getTime() || 0;

      // 2. Subtract for descending order (Newest first)
      return timeB - timeA;
    });

    console.log('Expenses Filted: ', filtered);

    return filtered;
    
   
  }







  const saveExpense = () => {

    if(bankMessage.categoryGuidId === ''){
      presentToast({ message: 'To save to Explense, a category must be selected.', duration: 2000, color: 'danger' }); 
      return;
    }
    
    presentAlert({
      header: 'Confirm Expense',
      message: `Are you sure you want to save R${amount} for ${bankMessage.categoryName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          role: 'confirm',
          handler: () => {
            
            let smsExpenseModel: SmsExpenseModel = {
            smsId: bankMessage.id,
            smsBody: bankMessage.body,
            categoryName: bankMessage.categoryName,
            categoryGuidId: bankMessage.categoryGuidId,
            amount: amount,
            comment: comment,
            onlyMarkAsCompleted: false,
            year: budgetYear,
            month: budgetMonth,
            guidId: '',
            shareToken: ''
          };

          modalRef.current?.dismiss(smsExpenseModel, 'confirm')
          },
        },
      ],
    });
  }

  const markCompleted = () => {
    presentAlert({
      header: 'Confirm Expense',
      message: `Are you sure you want MARK this SMS as Completed?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          role: 'confirm',
          handler: () => {
          let smsExpenseModel: SmsExpenseModel = {
              smsId: bankMessage.id,
              smsBody: bankMessage.body,
              categoryName: bankMessage.categoryName,
              categoryGuidId: bankMessage.categoryGuidId,
              amount: amount,
              comment: comment,
              onlyMarkAsCompleted: true,
              year: budgetYear,
              month: budgetMonth,
              guidId: '',
              shareToken: ''
            };

            modalRef.current?.dismiss(smsExpenseModel, 'confirm')
          },
        },
      ],
    });
  }

  const extractAmount = (body: string): number => {
    if (!body) return 0;

    // This Regex looks for: R + digits/commas/dots + optional space + , Total Avail Bal
    // The parenthesis ( ) capture just the number part
    const regex = /R([\d,.]+)(?=,\s*Total Avail Bal)/;
    const match = body.match(regex);

    if (match && match[1]) {
      // Remove the comma thousands-separator so parseFloat works (1,147.00 -> 1147.00)
      const cleanNumber = match[1].replace(/,/g, '');
      return parseFloat(cleanNumber);
    }

    return 0;
  };


  return (
    <IonModal 
      trigger='add-config' 
      // breakpoints={[1, 0.5]} 
      // initialBreakpoint={0.5} 
      ref={modalRef} 
      onWillDismiss={onDismiss}
    >
      <IonHeader>
        <IonToolbar color={'primary'}>
          <IonButtons slot='start'>
            <IonButton onClick={() => modalRef.current?.dismiss(null, 'cancel')}>
              <IonIcon slot='icon-only' icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Expense 
 

          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className='ion-padding'>

        <IonLabel color={'secondary'} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', padding: '0px 15px 15px 15px'  }}>{bankMessage?.body}</IonLabel>


        <IonItem style={{paddingBottom: '10px'}}>
          <IonSelect
            labelPlacement="floating"
            label="Category"
            placeholder="Select a Category"
            value={bankMessage.categoryGuidId}
            onIonChange={(e) => {
              const selectedGuid = e.detail.value as string;
              const selectedCategory = categories.find(c => c.guidId === selectedGuid);
              if (selectedCategory) {

                setSelectedCategory(selectedCategory);
                
                const fExp = getfilterExpenses(selectedCategory.guidId);
                setExpenseCatHistory(fExp);

                setBankMessage(prev => ({
                  ...prev,
                  categoryGuidId: selectedCategory.guidId,
                  categoryName: selectedCategory.categoryName
                }));
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


        <IonAccordionGroup className="ion-margin-bottom">
          <IonAccordion value="history">
            <IonItem slot="header" color="light" lines="full">
              <IonIcon icon={timeOutline} slot="start" color="primary" />
              <IonLabel>
                <h2>Category History</h2>
                <p style={{ fontSize: '12px' }}>{expenseCatHistory.length} previous transactions</p>
                
                
                {selectedCategory && (() => {
                  // Calculate the value once
                  const budgetLeft = calculateBudgetLeft(selectedCategory, expenseCatHistory);
                  const isOverspent = budgetLeft < 0;

                  return (
                    <p style={{ 
                      fontSize: '12px', 
                      color: isOverspent ? 'var(--ion-color-danger)' : 'var(--ion-color-secondary)',
                      fontWeight: isOverspent ? 'normal' : 'normal' // Optional: makes it pop more
                    }}>
                      {currencyFormatter.format(budgetLeft)} {isOverspent ? 'overspent' : 'left'} on {selectedCategory.categoryName}
                    </p>
                  );
                })()}



              </IonLabel>
            </IonItem>

            <div slot="content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
              {expenseCatHistory.length > 0 ? (expenseCatHistory.map((exp) => (
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
                        <IonLabel style={{ 
        fontSize: '10px', 
        display: 'flex', 
        alignItems: 'flex-start', // Use flex-start so icon stays at top of long comments
        gap: '5px', 
        opacity: 0.7,
        whiteSpace: 'normal',    // Crucial: Allows text to wrap to next line
        width: '100%',           // Ensures it uses the full Col width
        lineHeight: '1.4'        // Makes wrapped text easier to read
      }}>
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

        <IonItem style={{paddingBottom: '15px'}}>
    
          <IonTextarea
            labelPlacement="floating"
            rows={3} // Initial height
            label='Notes'
            value={comment}
            onIonInput={(e) => setComment(e.detail.value!)}
          />

        </IonItem>
        
        
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
                  <IonCol size="6">
                    <IonButton expand='block' color={'secondary'} onClick={markCompleted}>
                        Mark Completed
                    </IonButton> 
                  </IonCol>
                  <IonCol size="6">
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
    </IonModal>
  );
};

export default SmsExpenseModal;