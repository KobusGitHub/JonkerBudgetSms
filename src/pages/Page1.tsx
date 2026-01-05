import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonMenuButton, IonButtons } from '@ionic/react'

const Page1: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Page1</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonButton routerLink='/app/page1/details' expand='full'>
                    Go Deeper!
                </IonButton>
            </IonContent>
        </IonPage>
    )
}

export default Page1