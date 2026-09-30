import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSplitPane, IonMenu, IonRouterOutlet, IonMenuToggle, IonItem, IonDatetime, IonButton, IonIcon, IonFooter, } from '@ionic/react'
import { cardOutline, chatboxEllipsesOutline, cogOutline, documentTextOutline, homeOutline, layersOutline, newspaperOutline, peopleOutline, pricetagsOutline, settingsOutline, swapHorizontalOutline, trendingUpOutline } from 'ionicons/icons'
import { Redirect, Route } from 'react-router'
import Details from './Details'
import Page1 from './Page1'
import Page2 from './Page2'
import Home from './Home'
import SmsExpensePage from './SmsExpensePage'
import SmsConfigPage from './SmsConfigPage'
import CategoriesSetupPage from './CategoriesSetupPage'
import ExpenseReportPage from './ExpenseReportPage'
import CategoryGroupReportPage from './CategoryGroupReportPage'
import ForecastPage from './ForecastPage'
import UserManagementPage from './UserManagementPage'
import LinkExpense from './LinkExpense'
import { useAuth } from '../context/AuthContext'
import BackButtonHandler from './BackButtonHandler'
import TransferPage from './TransferPage'
import ExpensePage from './ExpensePage'
import BudgetSetupPage from './BudgetSetupPage'

const Menu: React.FC = () => {

    const { logout, isAdmin } = useAuth();
    
    const paths = [
        { name: 'Home', url:'/app/home', icon: homeOutline },
        { name: 'SMS Expense', url:'/app/sms-expense', icon: chatboxEllipsesOutline },
        { name: 'Expense', url:'/app/expense', icon: cardOutline },
        { name: 'Transfer', url:'/app/transfer', icon: swapHorizontalOutline },
        { name: 'SMS Config', url:'/app/sms-config', icon: cogOutline },
        { name: 'Categories Setup', url:'/app/categories-setup', icon: pricetagsOutline },
        { name: 'Budget Setup', url:'/app/budget-setup', icon: settingsOutline },
        { name: 'Expense Report', url:'/app/expense-report', icon: documentTextOutline },
        { name: 'Category Group Report', url:'/app/category-group-report', icon: layersOutline },
        { name: 'Forecast', url:'/app/forecast', icon: trendingUpOutline },
        ...(isAdmin ? [{ name: 'User Management', url:'/app/user-management', icon: peopleOutline }] : []),
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
                    <Route exact path="/app/sms-expense" component={SmsExpensePage} />
                    <Route exact path="/app/sms-config" component={SmsConfigPage} />
                    <Route exact path="/app/categories-setup" component={CategoriesSetupPage} />
                    <Route exact path="/app/budget-setup" component={BudgetSetupPage} />
                    <Route exact path="/app/expense-report" component={ExpenseReportPage} />
                    <Route exact path="/app/category-group-report" component={CategoryGroupReportPage} />
                    <Route exact path="/app/forecast" component={ForecastPage} />
                    <Route exact path="/app/user-management" render={() => isAdmin ? <UserManagementPage /> : <Redirect to="/app/home" />} />
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