import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonMenuButton, IonButtons } from '@ionic/react'

const LinkExpense: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Link Expense</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                Hello world, Link Expense page!
            </IonContent>
        </IonPage>
    )
}

export default LinkExpense