import React from 'react';
import { 
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonTitle, IonContent, IonItem, IonInput, 
  IonSelect, IonSelectOption, 
  IonGrid,
  IonRow,
  IonCol,
  IonTextarea,
  IonFooter
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { CategoryModel } from '../models/CategoryModel';
import { SmsConfigModel } from '../models/SmsConfigModel';

interface Props {
  isOpen: boolean; // Control visibility from parent if not using trigger
  modalRef: React.RefObject<HTMLIonModalElement>;
  categories: CategoryModel[];
  smsConfig: SmsConfigModel;
  setSmsConfig: React.Dispatch<React.SetStateAction<SmsConfigModel>>;
  onDismiss: (event: CustomEvent) => void;
}

const SmsConfigModal: React.FC<Props> = ({ 
  modalRef, 
  categories, 
  smsConfig, 
  setSmsConfig, 
  onDismiss 
}) => {
  return (
    <IonModal 
      trigger='add-config' 
      breakpoints={[1, 0.5]} 
      initialBreakpoint={0.5} 
      ref={modalRef} 
      onWillDismiss={onDismiss}
    >
      <IonHeader>
        <IonToolbar color={'secondary'}>
          <IonButtons slot='start'>
            <IonButton onClick={() => modalRef.current?.dismiss(null, 'cancel')}>
              <IonIcon slot='icon-only' icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Add/Edit SMS Config</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className='ion-padding'>


        <IonItem>
          <IonSelect
            labelPlacement="floating"
            label="Category"
            placeholder="Select a Category"
            value={smsConfig.categoryGuidId}
            onIonChange={(e) => {
              const selectedGuid = e.detail.value as string;
              const selectedCategory = categories.find(c => c.guidId === selectedGuid);
              if (selectedCategory) {
                setSmsConfig(prev => ({
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

        <IonItem>
    
          <IonTextarea
            labelPlacement="floating"
            rows={3} // Initial height
            label='Search Pattern'
            placeholder='Search Pattern'
            value={smsConfig.searchPattern}
            onIonInput={(e) => setSmsConfig(prev => ({ ...prev, searchPattern: e.detail.value! }))}
          />

        </IonItem>

        <IonButton expand='block' onClick={() => modalRef.current?.dismiss(smsConfig, 'confirm')}>
          Save Task
        </IonButton>
      </IonContent>



    </IonModal>
  );
};

export default SmsConfigModal;