import { IonGrid, IonRow, IonCol, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToast, IonToolbar, useIonActionSheet, useIonAlert, useIonLoading, useIonToast, IonMenuButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonText } from '@ionic/react';
import { addDoc, collection, CollectionReference, deleteDoc, doc, DocumentData, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { FIREBASE_DB, FIREBASE_STOREAGE } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { addOutline, basketOutline, closeOutline, personOutline, trashOutline } from 'ionicons/icons';
import AppFooter from '../components/AppFooter';

import SmsConfigModal from './SmsConfigModal';
import { CategoryModel } from '../models/CategoryModel';
import { SmsConfigModel } from '../models/SmsConfigModel';
import { SmsIdentifierModel } from '../models/SmsIdentifierModel';






const SmsConfigPage: React.FC = () => {

    const [show, hide] = useIonLoading();
    const [ present, dismiss ] = useIonAlert();
    const [presentActionSheet] = useIonActionSheet();
    const [showToast, setShowToast] = useState(false);
    const [presentToast, dismissToast] = useIonToast();

    const { user } = useAuth();
    const smsConfigModalRef = useRef<HTMLIonModalElement>(null);
    const [presentAlert] = useIonAlert();

    

    const [smsConfigCollectionRef, setSmsConfigCollectionRef] = useState<CollectionReference>()



    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [smsConfigs, setSmsConfigs] = useState<SmsConfigModel[]>([]);
    const [smsIdentifiers, setSmsIdentifiers] = useState<SmsIdentifierModel[]>([]);
    const [newIdentifier, setNewIdentifier] = useState('');
    const [savingIdentifier, setSavingIdentifier] = useState(false);
    const [smsConfig, setSmsConfig] = useState<SmsConfigModel>({
                                guidId: '',
                                categoryGuidId: '',
                                categoryName: '',
                                searchPattern: '',
                                isDeleted: false,
                                shareToken: ''
                             });

    // Load categories from Firestore
    useEffect(() => {
        const categoryCollection = collection(FIREBASE_DB, 'category');
        const q = query(categoryCollection, where('isDeleted', '==', false), where('shareToken', '==', user?.uid));

        // if view is destroid, the subscription will stop
        const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {

            const categories = querySnapshot.docs.map((doc: DocumentData) => {
                // return {
                //     id: doc.id,
                //     ...doc.data()
                // }
                return {
                    guidId: doc.id,
                    ...doc.data()
                }
            });

            categories.sort((a: any, b: any) => {
                // 1. Primary Sort: isFavourite (true first)
                // In JS, true (1) comes after false (0), so we subtract b from a for descending
                const favA = a.isFavourite ? 1 : 0;
                const favB = b.isFavourite ? 1 : 0;

                if (favA !== favB) {
                    return favB - favA; // High value (1/true) moves to the top
                }

                // 2. Secondary Sort: categoryName (Alphabetical)
                // This only runs if both items have the same 'isFavourite' status
                const nameA = a.categoryName?.toLowerCase() || '';
                const nameB = b.categoryName?.toLowerCase() || '';
                return nameA.localeCompare(nameB);
            });


            console.log('Categories Fetched: ', categories);
            setCategories(categories);
        })
        return unsubscribe;


    }, []);

    // Load smsConfigs from Firestore
    useEffect(() => {
        const smsConfigCollection = collection(FIREBASE_DB, 'smsConfig');
        setSmsConfigCollectionRef(smsConfigCollection);

        const q = query(smsConfigCollection, where('isDeleted', '==', false), where('shareToken', '==', user?.uid));

        // if view is destroid, the subscription will stop
        const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {

            const smsConfigs = querySnapshot.docs.map((doc: DocumentData) => {
                // return {
                //     id: doc.id,
                //     ...doc.data()
                // }
                return {
                    guidId: doc.id,
                    ...doc.data()

                }
            });

            console.log('smsConfig Fetched: ', smsConfigs);
            setSmsConfigs(smsConfigs.sort((first: SmsConfigModel, second: SmsConfigModel) =>
                (first.categoryName ?? '').localeCompare(second.categoryName ?? '', undefined, { sensitivity: 'base' })
            ));
        })
        return unsubscribe;


    }, []);


    useEffect(() => {
        if (!user?.uid) return;

        const identifiersQuery = query(collection(FIREBASE_DB, 'smsIdentifier'), where('shareToken', '==', user.uid));
        return onSnapshot(identifiersQuery, snapshot => {
            const identifiers = snapshot.docs.map(identifierDoc => ({
                guidId: identifierDoc.id,
                ...identifierDoc.data()
            })) as SmsIdentifierModel[];
            setSmsIdentifiers(identifiers.sort((first, second) =>
                first.identifier.localeCompare(second.identifier, undefined, { sensitivity: 'base' })
            ));
        }, error => {
            console.error('SMS identifiers fetch failed:', error);
            presentToast({ message: 'Could not load SMS identifiers', duration: 3000, color: 'danger' });
        });
    }, [user?.uid]);

    const addIdentifier = async () => {
        const identifier = newIdentifier.trim();
        if (!user?.uid || !identifier || savingIdentifier) return;

        if (smsIdentifiers.map(item => item.identifier)
            .some(existing => existing.toLowerCase() === identifier.toLowerCase())) {
            presentToast({ message: 'Identifier already exists', duration: 2000, color: 'warning' });
            return;
        }

        setSavingIdentifier(true);
        try {
            const identifierDoc = doc(collection(FIREBASE_DB, 'smsIdentifier'));
            await setDoc(identifierDoc, { guidId: identifierDoc.id, identifier, shareToken: user.uid } satisfies SmsIdentifierModel);
            setNewIdentifier('');
            presentToast({ message: 'Identifier added', duration: 2000, color: 'success' });
        } catch (error) {
            console.error('SMS identifier save failed:', error);
            presentToast({ message: 'Could not save identifier', duration: 2000, color: 'danger' });
        } finally {
            setSavingIdentifier(false);
        }
    };

    const removeIdentifier = async (identifier: SmsIdentifierModel) => {
        try {
            await deleteDoc(doc(FIREBASE_DB, 'smsIdentifier', identifier.guidId));
            presentToast({ message: 'Identifier removed', duration: 2000, color: 'success' });
        } catch (error) {
            console.error('SMS identifier delete failed:', error);
            presentToast({ message: 'Could not remove identifier', duration: 2000, color: 'danger' });
        }
    };

    const openActionSheet = (config: SmsConfigModel) => {
        presentActionSheet({
            header: `Actions for: ${config.categoryName}`,
            buttons: [
                {
                    text: 'Update',
                    // role: 'selected', // Use this if you want it visually distinct
                    handler: () => {
                        // 💡 STEP 4: Define the action for the Update button
                        handleUpdateClick(config);
                    }
                },
                {
                    text: 'Delete',
                    role: 'destructive', // Red text for deletion
                    handler: () => {
                        presentAlert({
                            header: 'Confirm Delete',
                            message: `Are you sure you want delete ${config.categoryName}?`,
                            buttons: [
                            {
                                text: 'Cancel',
                                role: 'cancel',
                            },
                            {
                                text: 'Confirm',
                                role: 'confirm',
                                handler: () => {
                                    handleDeleteClick(config);
                                },
                            },
                            ],
                        });
                    }
                },
                {
                    text: 'Cancel',
                    role: 'cancel', // Automatically closes the sheet
                },
            ],
            onDidDismiss: ({ detail: { role } }) => {
                console.log('Action Sheet dismissed with role:', role);
            },
        });
    };


    const handleUpdateClick = (configToEdit: SmsConfigModel) => {
        // 1. Load the existing config data into the state
        setSmsConfig(configToEdit);

        // 2. Open the modal (assuming 'addModal' is the ref for your IonModal)
        smsConfigModalRef.current?.present();
    };

    const handleDeleteClick = async (configToDelete: SmsConfigModel) => {
       
        const docRef = doc(smsConfigCollectionRef!, configToDelete.guidId);
        await deleteDoc(docRef);

        presentToast({ message: 'SMS Configuration Deleted Successfully!', duration: 2000, color: 'success' }); // Note: No 'presentToast' wrapper needed.

    };


     const onSmsConfigModalDismiss = async (event: CustomEvent) => {
        console.log('event detail: ', event.detail);
        
        console.log(event);
        if(event.detail.role == 'confirm'){


            // Get the current configuration data from state
            let currentSmsConfig = smsConfig;
            let existingDocId = currentSmsConfig.guidId;
            


            if(currentSmsConfig.guidId == ''){
                // we are trying to add. Lets see if we dont already have that cagegory, then we can update
                const recToUpdate = smsConfigs.find(config => config.categoryGuidId === currentSmsConfig.categoryGuidId);
                if(recToUpdate !== undefined){
                    recToUpdate.searchPattern = smsConfig.searchPattern;
                    setSmsConfig(recToUpdate);

                    currentSmsConfig = recToUpdate
                    existingDocId = currentSmsConfig.guidId;
                }

               
            }

           
            // Determine if this is an UPDATE: check if the ID exists in our main list
            const isUpdate = smsConfigs.some(config => config.guidId === existingDocId);
            
            await show();

            if (isUpdate) {
                // --- UPDATE EXISTING DOCUMENT ---

                const docRef = doc(smsConfigCollectionRef!, existingDocId);
                // Create a copy of the state data to send to Firestore
                const dataToUpdate = { ...currentSmsConfig };

                // Update the document in place
                await updateDoc(docRef, dataToUpdate);
                console.log('Document successfully UPDATED:', existingDocId);

                presentToast({ message: 'SMS Configuration Updated Successfully!', duration: 2000, color: 'success' }); // Note: No 'presentToast' wrapper needed.

            } else {
                // --- CREATE NEW DOCUMENT ---

                // 1. Create a DocumentReference with a new auto-generated ID
                const newDocRef = doc(smsConfigCollectionRef!);

                // 2. Get the new ID immediately
                const newDocId = newDocRef.id;


                const configToSave: SmsConfigModel = {
                    ...currentSmsConfig, // Use all the user-entered data
                    guidId: newDocId, // OVERRIDE temp ID with the real Firestore ID
                    shareToken: user?.uid ?? ''
                };

               

                // Use addDoc and capture the DocumentReference
                await setDoc(newDocRef, configToSave);
                console.log('New document CREATED:', newDocId);
                presentToast({ message: 'SMS Configuration Saved Successfully!', duration: 2000, color: 'success' }); // Note: No 'presentToast' wrapper needed.

            }
        }

        setSmsConfig({
            guidId: '',
            categoryGuidId: '',
            categoryName: '',
            searchPattern: '',
            isDeleted: false,
            shareToken: ''
        });

        await hide();
    }



    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>SMS Config</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
<div>
                <section aria-label="Bank message identifiers">
                    <h2>Bank message identifiers</h2>
                    <IonList>
                        {smsIdentifiers.map(item => (
                            <IonItem key={item.guidId}>
                                <IonLabel>{item.identifier}</IonLabel>
                                <IonButton slot="end" fill="clear" color="danger" aria-label={`Remove ${item.identifier}`} onClick={() => removeIdentifier(item)}>
                                    <IonIcon slot="icon-only" icon={trashOutline} />
                                </IonButton>
                            </IonItem>
                        ))}
                        <IonItem>
                            <IonInput label="New identifier" labelPlacement="stacked" placeholder="Text found in bank SMS" value={newIdentifier} onIonInput={event => setNewIdentifier(event.detail.value ?? '')} />
                            <IonButton slot="end" aria-label="Add identifier" disabled={!newIdentifier.trim() || savingIdentifier} onClick={addIdentifier}>
                                <IonIcon slot="icon-only" icon={addOutline} />
                            </IonButton>
                        </IonItem>
                    </IonList>
                </section>

                <h2>Category patterns</h2>
                {/* Display List */}
                {smsConfigs.map((smsConfigItem) => (
                    
                    <IonCard key={smsConfigItem.guidId}
                        button={true} // Makes the item tappable/clickable
                        onClick={() => openActionSheet(smsConfigItem)} // Open action sheet on click
                        style={{ '--padding-start': '0' }}>
                     
                     <IonCardHeader>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <IonCardSubtitle style={{fontSize: '15px',  display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}>
                                <IonIcon icon={basketOutline} size="small" />
                                {smsConfigItem.categoryName}
                            </IonCardSubtitle>
                       </div>
                     </IonCardHeader>
                    <IonCardContent>


                        <IonText color="dark">
                        <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>{smsConfigItem.searchPattern}</p>
                        </IonText>
                
                      


                    </IonCardContent>
                    
                    </IonCard>

                    
                   
                ))}
            

                {/* Add / Update Model List */}
                <SmsConfigModal 
                    modalRef={smsConfigModalRef}
                    categories={categories}
                    smsConfigs={smsConfigs}
                    smsConfig={smsConfig}
                    setSmsConfig={setSmsConfig}
                    onDismiss={onSmsConfigModalDismiss}
                    isOpen={false} // Only needed if you aren't using the 'trigger' ID
                />
               
            </div>

            {/* Add Button */}
                <IonFab vertical='bottom' horizontal='end' slot='fixed'>
                    <IonFabButton id='add-config'>
                        <IonIcon icon={addOutline}></IonIcon>
                    </IonFabButton>
               </IonFab>
            </IonContent>

            <AppFooter />
        </IonPage>
    );
};

export default SmsConfigPage;