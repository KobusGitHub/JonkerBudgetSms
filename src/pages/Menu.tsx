import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSplitPane, IonMenu, IonRouterOutlet, IonMenuToggle, IonItem, IonDatetime, IonButton, IonIcon, IonFooter, } from '@ionic/react'
import { cardOutline, cogOutline, homeOutline, newspaperOutline, swapHorizontalOutline } from 'ionicons/icons'
import { Redirect, Route } from 'react-router'
import Details from './Details'
import Page1 from './Page1'
import Page2 from './Page2'
import Home from './Home'
import ConfigPage from './ConfigPage'
import LinkExpense from './LinkExpense'
import { useAuth } from '../context/AuthContext'
import BackButtonHandler from './BackButtonHandler'
import TransferPage from './TransferPage'
import ExpensePage from './ExpensePage'

const Menu: React.FC = () => {

    const { logout, user } = useAuth();
    
    const paths = [
        { name: 'Home', url:'/app/home', icon: homeOutline },
        { name: 'Expense', url:'/app/expense', icon: cardOutline },
        { name: 'Transfer', url:'/app/transfer', icon: swapHorizontalOutline },
        { name: 'Config', url:'/app/configPage', icon: cogOutline },
    ]

 

    return (
        <IonPage>
           <IonSplitPane contentId='main'>
                <IonMenu contentId='main'>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>
                                Menu
                            </IonTitle>
                        </IonToolbar>
                    </IonHeader>

                    <IonContent>

                        {paths.map((item, index) => (
                           <IonMenuToggle key={index}>
                                <IonItem routerLink={item.url} >
                                    <IonIcon icon={item.icon} slot="start"></IonIcon>
                                    {item.name}
                                </IonItem>
                           </IonMenuToggle> 
                        ))}

                        
                    </IonContent>

                    <IonFooter>
                        <IonToolbar>
                        <IonButton onClick={logout} routerLink='/' routerDirection='back' expand='full'>Logout</IonButton>
                        </IonToolbar>
                    </IonFooter>
                </IonMenu>


                {/* <BackButtonHandler /> */}
                
                <IonRouterOutlet id="main">
                    <Route exact path="/app/home" component={Home} />
                    <Route exact path="/app/configPage" component={ConfigPage} />
                    <Route exact path="/app/page1" component={Page1} />
                    <Route exact path="/app/page1/details" component={Details} />
                    <Route exact path="/app/page2" component={Page2} />
                    <Route exact path="/app/link-expense" component={LinkExpense} />
                    <Route exact path="/app/transfer" component={TransferPage} />
                    <Route exact path="/app/expense" component={ExpensePage} />
                    <Route exact path="/app">
                        <Redirect to="/app/home" />
                    </Route>
                </IonRouterOutlet>
           </IonSplitPane>
        </IonPage>
    )
}

export default Menu