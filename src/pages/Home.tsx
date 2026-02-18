import { IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonMenuButton, IonPage, IonRefresher, IonRefresherContent, IonText, IonTitle, IonToolbar, useIonRouter, useIonToast, useIonViewWillEnter } from '@ionic/react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useEffect, useRef, useState } from 'react';
import { barcodeOutline, cardOutline, checkmarkCircleOutline, checkmarkDoneCircleOutline, clipboardOutline, closeCircleOutline, link, personOutline, timeOutline } from 'ionicons/icons';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { collection, CollectionReference, doc, DocumentData, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MessageModel } from '../models/MessageModel';
import { CategoryModel } from '../models/CategoryModel';
import { SmsConfigModel } from '../models/SmsConfigModel';
import SmsExpenseModal from './SmsExpenseModal';
import { SmsExpenseModel } from '../models/SmsExpenseModel';
import BudgetSetup from './BudgetSetup';
import { ExpenseModel } from '../models/ExpenseModel';
import { sortCategories } from '../shared/utils';


// Using the exact name you found in the Java folders
const MessageReader = registerPlugin<any>('MessageReader');

const Home: React.FC = () => {
  const { user } = useAuth(); 
  const router = useIonRouter();
  const [bankMessages, setBankMessages] = useState<MessageModel[]>([]);
  const [bankMessage, setBankMessage] = useState<MessageModel>({
    id: '',
    sender: '',
    body: '',
    date: 0,
    messageType: '',
    categoryName: '',
    categoryGuidId: '',
    onlyMarkAsCompleted: false
});
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [smsConfig, setSmsConfig] = useState<SmsConfigModel[]>([]);
  const [smsExpenses, setSmsExpenses] = useState<SmsExpenseModel[]>([]);

  const [isCategoryLoaded, setIsCategoryLoaded] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const [budgetYear, setBudgetYear] = useState(() => {
    const year = localStorage.getItem('budget_year');
    return year ? parseInt(year) : new Date().getFullYear();
  });

  const [budgetMonth, setBudgetMonth] = useState(() => {
    const month = localStorage.getItem('budget_month');
    return month ? month : new Date().toLocaleString('default', { month: 'long' });
  });
  

  const smsExpenseModalRef = useRef<HTMLIonModalElement>(null);
  

  const [smsExpenseCollectionRef, setSmsExpenseCollectionRef] = useState<CollectionReference>()
  
  const [presentToast, dismissToast] = useIonToast();
  

  // useIonViewWillEnter(() => {
  //     resetForm();
  // });
      
  const resetForm = () => {
    
    setBankMessage({
      id: '',
      sender: '',
      body: '',
      date: 0,
      messageType: '',
      categoryName: '',
      categoryGuidId: '',
      onlyMarkAsCompleted: false
    });
    
  }  

  /* CATEGORY */
  useEffect(() => {
      const categoryCollection = collection(FIREBASE_DB, 'category');
      var q = query(categoryCollection, 
        where('isDeleted', '==', false), 
        where('shareToken', '==', user?.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {
        const categories = querySnapshot.docs.map((doc: DocumentData) => {
          return {
            guidId: doc.id,
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





   /* SMS CONFIG */
  useEffect(() => {
      const smsConfigCollection = collection(FIREBASE_DB, 'smsConfig');
      var q = query(smsConfigCollection, where('isDeleted', '==', false), where('shareToken', '==', user?.uid));

      const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {
        const smsConfigs = querySnapshot.docs.map((doc: DocumentData) => {
          return {
            guidId: doc.id,
            ...doc.data()
          }
        });

        console.log('smsConfig Fetched: ', smsConfigs);
        setSmsConfig(smsConfigs); 

        setIsConfigLoaded(true);
        console.log('isConfigLoaded set to true');
      });

      return unsubscribe;
      

  }, []);

  /* SMS INBOX */
  useEffect(() => {
    // Define the async wrapper
    const initData = async () => {
      if (isCategoryLoaded && isConfigLoaded) {
        console.log("Both finished! Loading third effect...");
        
        // Now you can safely use await
        await loadMessages(smsExpenses);
      }
    };

    initData();

  }, [isCategoryLoaded, isConfigLoaded]);

  /* SMS EXPENSES */
  useEffect(() => {
    // 1. GUARD: Don't start the listener if user or filters are missing
    if (!user?.uid || !budgetMonth || !budgetYear) return;

    console.log(`Setting up listener for ${budgetMonth} ${budgetYear}`);


    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let currentMonthIndex = months.findIndex(i => i.toLowerCase() === budgetMonth.toLowerCase());
    let previousMonth = "January";
    if(currentMonthIndex > 0){
      previousMonth = months[currentMonthIndex - 1];
    }
    


    const smsExpenseCollection = collection(FIREBASE_DB, 'smsExpense');
    
    // 2. QUERY: Ensure the field names match your Firestore document keys exactly
    const q = query(
      smsExpenseCollection, 
      where('shareToken', '==', user.uid),
      // where('month', '==', budgetMonth),
      where('month', 'in', [budgetMonth, previousMonth]),
      where('year', '==', budgetYear)
    );

    // 3. ON SNAPSHOT: This is the "Live" part that fires when Firebase changes
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const localSmsExpenses = querySnapshot.docs.map((doc) => ({
        guidId: doc.id,
        ...doc.data()
      })) as unknown as SmsExpenseModel[];

      console.log('Real-time update received:', localSmsExpenses);
      setSmsExpenses(localSmsExpenses);


      await loadMessages(localSmsExpenses); // Refresh messages to reflect any changes
    }, (error) => {
      console.error("Firestore Listener failed:", error);
    });

    // 4. CLEANUP: This stops the listener when the component unmounts 
    // or when month/year changes (to prevent memory leaks)
    return () => unsubscribe();

  }, [budgetYear, budgetMonth, user?.uid]);



  const loadMessages = async (expenses?: SmsExpenseModel[]) => {


    const isDevice = Capacitor.isNativePlatform(); // returns true on Android/iOS, false on Web
    
    let messages: any = [];
    if (isDevice) {
      messages = await getSmsMessages();
    } else {
      messages = await getMockMessages();
    }
      
    console.log('Messages fetched:', messages);


    const formattedMessages: MessageModel[] = messages.map((msg: any) => ({
      ...msg,
      categoryName: '',
      categoryGuidId: '',
      onlyMarkAsCompleted: false
    }));
    console.log('Formatted Messages:', formattedMessages);

    const bankMsgs = filterBankMessages(formattedMessages);
    console.log('Bank messages filtered and set.');


    const updatedMessages = matchSmsExpenseToMessages(bankMsgs, expenses);
    setBankMessages(updatedMessages);
    //setBankMessages(bankMsgs);

    console.log('Bank messages state updated.');

  };



  const navigateToLinkExpense = (msg: MessageModel) => {
    
    // router.push(`/app/link-expense`, 'forward', 'push', msg as any);
    if(msg.categoryGuidId !== '' && msg.categoryGuidId !== null){
        presentToast({ message: 'SMS already Linked', duration: 2000, color: 'danger' }); 
        return;
    }

    if(msg.onlyMarkAsCompleted){
        presentToast({ message: 'SMS already Completed', duration: 2000, color: 'danger' }); 
        return;
    }

    
    var cat = predictCategoryToMessage(msg);
    if (cat !== null && cat !== undefined) {

      msg = {
        ...msg,
        categoryGuidId: cat!.guidId,
        categoryName: cat!.categoryName
      };
    }
  
    

    setBankMessage(msg);
    smsExpenseModalRef.current?.present();

  }

  const writeSmsExpense = async (smsExpense: SmsExpenseModel) => {
      const smsExpenseCollection = collection(FIREBASE_DB, 'smsExpense');
      setSmsExpenseCollectionRef(smsExpenseCollection);

      const newDocRef = doc(smsExpenseCollection);
      const newDocId = newDocRef.id;


      const recToSave: SmsExpenseModel = {
          ...smsExpense, // Use all the user-entered data
          guidId: newDocId, // OVERRIDE temp ID with the real Firestore ID
          shareToken: user?.uid ?? ''
      };

      await setDoc(newDocRef, recToSave);
  };

   const writeExpense = async (smsExpense: SmsExpenseModel) => {
      const smsExpenseCollection = collection(FIREBASE_DB, 'expense');
      setSmsExpenseCollectionRef(smsExpenseCollection);

      const newDocRef = doc(smsExpenseCollection);
      const newDocId = newDocRef.id;

      const myDate = new Date();

      let exp : ExpenseModel = {
        categoryGuidId: smsExpense.categoryGuidId,
        comment: smsExpense.comment,
        expenseCode: crypto.randomUUID(),
        expenseValue: smsExpense.amount,
        guidId: newDocId,
        month: smsExpense.month,
        recordDate: myDate.toString(),
        shareToken: user?.uid ?? '',
        year: smsExpense.year
      };

      console.log('Expense to save: ', exp);
     
      await setDoc(newDocRef, exp);
  };




  const onSmsExpenseModalDismiss= async (event: CustomEvent) => {
    console.log('SmsExpenseModal - event detail: ', event.detail);
    if(event.detail.role == 'confirm'){
      console.log('SmsExpenseModal - Confirmed data: ', event.detail.data);

      
      await writeSmsExpense(event.detail.data);
      if(event.detail.data.onlyMarkAsCompleted === false){
        await writeExpense(event.detail.data);
      }

      presentToast({ message: 'SMS Expense Saved Successfully!', duration: 2000, color: 'success' }); // Note: No 'presentToast' wrapper needed.


    }
  };

  const getSmsMessages = async () => {
    try {
        const perm = await MessageReader.checkPermissions();
        if (perm.messages !== 'granted') {
          await MessageReader.requestPermissions();
        }

        // Calculate the timestamp for 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const minTimestamp = thirtyDaysAgo.getTime();

        // The method found in your folders likely uses this filter:
        const result = await MessageReader.getMessages({
          minDate: minTimestamp,
          limit: 200
        });
        
        return result.messages;

    } catch (error) {
        console.error("SMS Error:", error);
    }
    return [];
  };

  const getMockMessages = async () => {
    const mockMessages = [
      {  
          id: '3401',
          sender: '+279600003004041',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, SASOL RANDPARK RIDGE Randpark, R1,000.00, Total Avail Bal R80,208.00. Help 0860008600; JONKEJJ151',
          date: 1765896768445,
          messageType: 'sms'
      },{  
          id: '3400',
          sender: '+279600003004041',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, TEST RANDPARK RIDGE Randpark, R2,222.22, Total Avail Bal R80,208.00. Help 0860008600; JONKEJJ151',
          date: 1765896768445,
          messageType: 'sms'
      },{  
          id: '3494',
          sender: '+279600003004041',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, SASOL RANDPARK RIDGE Randpark, R1,147.00, Total Avail Bal R80,208.00. Help 0860008600; JONKEJJ151',
          date: 1765896768445,
          messageType: 'sms'
      },{  
          id: '3493',
          sender: '+279600003004058',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, Checkers Ferndale SB085371, R1,555.00, Total Avail Bal R81,355.00. Help 0860008600; JONKEJJ151',
          date: 1765872611291,
          messageType: 'sms'
      }, {  
          id: '3492',
          sender: '+2782007229843460',
          body: 'Dear Mr Jonker. Thank you for supporting Paul Maher Ford . Safe Miles. Tel 011 431 1781',
          date: 1765872262017,
          messageType: 'sms'
      }, {  
          id: '3491',
          sender: '+2782007242069386',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, Dischem Ferndale JHB, R920.05, Total Avail Bal R82,910.00. Help 0860008600; JONKEJJ151',
          date: 1765871019799,
          messageType: 'sms'
      }, {  
          id: '3490',
          sender: '+279600003004017',
          body: 'Absa: CCRD7037, Pur, 16/12/25 AUTHORIZATION, TASKO SWEETS FERN10845RANDBURG, R259.00, Total Avail Bal R83,830.00. Help 0860008600; JONKEJJ151',
          date: 1765870299547,
          messageType: 'sms'
      }
        
    ];
   
    return mockMessages;
  }


  const filterBankMessages = (allMessages: MessageModel[]) => {

    const identifiers = [
    'Absa: CCRD7037', 
    'Absa: CCRD7029'
  ];


    // const bankMsgs = allMessages.filter(msg => 
    //   msg.body.includes('Absa: CCRD7037')
    // );
   
    const bankMsgs =  allMessages.filter(msg => 
      identifiers.some(term => msg.body.includes(term))
    );

    return bankMsgs;
  }

  const handleRefresh = async (event: CustomEvent) => {
    console.log('Refreshing data...');

    try {
      await loadMessages(smsExpenses);

      // Optional: Add a small delay so the user can see the "Refreshing" state
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      // 2. This is CRITICAL: Tell the UI the refresh is done so the spinner disappears
      event.detail.complete();
    }

  };



  // const matchCategoryToMessage = (bankMessage: MessageModel) => {
  //     const matchedConfig = smsConfig.find(config => {
  //       let searchPatterns = config.searchPattern.split('|');
  //       return searchPatterns.some(pattern => {
  //         return bankMessage.body.includes(pattern)
  //       });
  //     });

  //     if (matchedConfig) {
  //       const matchedCategory = categories.find(cat => cat.guidId === matchedConfig.categoryGuidId);
  //       if (matchedCategory) {
  //         return {
  //           ...bankMessage,
  //           categoryName: matchedCategory.categoryName,
  //           categoryGuidId: matchedCategory.guidId
  //         };
  //       }
  //     }

  //     return bankMessage; // No match, return original
  // }

  // const matchCategoriesToMessages = (bankMessages: MessageModel[]) => {
  //   const updatedMessages = bankMessages.map(msg => {
      

  //     return matchCategoryToMessage(msg);
  //   });

  //   return updatedMessages;
  // };

   const predictCategoryToMessage = (bankMessage: MessageModel) => {

      const lowerCaseBody = bankMessage.body.toLowerCase().trim();

      const matchedConfig = smsConfig.find(config => {
        let searchPatterns = config.searchPattern.split('|');
        return searchPatterns.some(pattern => {
          return lowerCaseBody.includes(pattern.toLocaleLowerCase().trim())
        });
      });

      if (matchedConfig) {
        const matchedCategory = categories.find(cat => cat.guidId === matchedConfig.categoryGuidId);
        if (matchedCategory) {
          return matchedCategory;
          };
      }
      
      return null; // No match
  }


  const matchSmsExpenseToMessages = (bankMessages: MessageModel[], localSmsExpenses?: SmsExpenseModel[]) => {
      const updatedMessages = bankMessages.map(msg => {
          const matchedExpense = localSmsExpenses?.find(exp => exp.smsId === msg.id);

          if (matchedExpense) {
              return {
                  ...msg,
              categoryName: matchedExpense.categoryName,
              categoryGuidId: matchedExpense.categoryGuidId,
              onlyMarkAsCompleted: matchedExpense.onlyMarkAsCompleted

          };
      }

      return msg; // No match, return original
    });

    return updatedMessages;
  };



// const fetchMessagesGreaterThanId = async (lastId: string) => {
//   const lastIdNum = parseInt(lastId, 10);

//   const result = await MessageReader.getMessages({
//     limit: 100 // Get a larger batch to search through
//   });

//   const newMessages = result.messages.filter((msg: any) => {
//     return parseInt(msg.id, 10) > lastIdNum;
//   });

//   setMessages(newMessages);
// };



// useEffect(() => {
//   const interval = setInterval(() => {
//     if (messages.length > 0) {
//       const latestTimestamp = messages[0].date;
//       fetchNewMessages(latestTimestamp);
//     }
//   }, 10000); // Check every 10 seconds

//   return () => clearInterval(interval);
// }, [messages])


  return (
    <IonPage>
       <IonHeader>
          <IonToolbar color={'primary'}>
              <IonButtons slot='start'>
                  <IonMenuButton></IonMenuButton>
              </IonButtons>
              <IonTitle>Home Page</IonTitle>
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
      <IonContent fullscreen>

      <IonRefresher slot="fixed" onIonRefresh={(e) => handleRefresh(e)}>
        <IonRefresherContent 
          pullingText="Pull to refresh SMS..." 
          refreshingSpinner="circles"
          refreshingText="Fetching inbox...">
        </IonRefresherContent>
      </IonRefresher>


        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">SMS</IonTitle>
          </IonToolbar>


        </IonHeader>
       <div>

        
                
          
          {bankMessages.map((msg) => (
            // <div key={msg.id} style={{ border: '1px solid black', margin: '10px', padding: '10px' }}>
            //   <p><strong>From:</strong> {msg.sender}</p>
            //   <p><strong>Body:</strong> {msg.body}</p>
            //   <p><strong>Date:</strong> {new Date(msg.date).toLocaleString()}</p>
            // </div>

            <IonCard key={msg.id} onClick={() => navigateToLinkExpense(msg)}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonCardSubtitle style={{fontSize: '10px',  display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                    <IonIcon icon={personOutline} size="small" />
                    {msg.sender}
                  </IonCardSubtitle>
                  <IonCardSubtitle style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                    <IonIcon icon={clipboardOutline} size="small" />
                    Message ID: {msg.id}
                  </IonCardSubtitle>
                 
                </div>

                 <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                  <IonIcon icon={timeOutline} size="small" />
                  <IonText style={{ fontSize: '10px' }}>
                    {new Date(msg.date).toLocaleString()}
                  </IonText>
                </div>
              </IonCardHeader>

              <IonCardContent>
                <IonText color="dark">
                  <p style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>{msg.body}</p>
                </IonText>
                
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>

                  {(() => {
                    if(msg.onlyMarkAsCompleted){
                        return (
                          <>
                            <IonIcon  icon={checkmarkDoneCircleOutline}  color='secondary' size="small" />
                            <IonText style={{ fontSize: '10px' }} color='secondary'>
                              Completed
                            </IonText>
                          </>
                        )

                    } else {
                      return (
                        <>
                          <IonIcon 
                            // icon={msg.categoryName ? checkmarkCircleOutline : closeCircleOutline} 
                            icon={msg.categoryName ? (msg.onlyMarkAsCompleted ? checkmarkDoneCircleOutline:  cardOutline) : closeCircleOutline} 
                            color={msg.categoryName ? 'secondary' : 'danger'}
                            size="small" />
                          <IonText 
                            style={{ fontSize: '10px' }}
                            color={msg.categoryName ? 'secondary' : 'danger'}>
                            {msg.categoryName ? `${msg.categoryName}` : 'Not Linked'}
                          </IonText>
                        </>
                      )
                    }
                  
                  })()}


                

                 
                </div>
               
              </IonCardContent>
            </IonCard>

          ))}

        </div>


        <SmsExpenseModal 
                    modalRef={smsExpenseModalRef}
                    categories={categories}
                    bankMessage={bankMessage!}
                    setBankMessage={setBankMessage}
                    onDismiss={onSmsExpenseModalDismiss}
                    isOpen={false}
                    budgetYear={budgetYear}
                    budgetMonth={budgetMonth}
                />


      </IonContent>

      <IonFooter style={{ height: '24px' }}>
        <IonToolbar>
          <div style={{ paddingBottom:' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',  width: '100%', color: '#6b7dba' }}>
            Jonker Budget Home
          </div>
        </IonToolbar>
      </IonFooter>

    </IonPage>
  );
};

export default Home;
