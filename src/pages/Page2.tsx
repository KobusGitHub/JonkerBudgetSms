import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from '@ionic/react'

const Page2: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Page2</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className='ion-padding'></IonContent>
        </IonPage>
    )
}

export default Page2