import { IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { cardOutline, chatboxEllipsesOutline, cogOutline, documentTextOutline, layersOutline, peopleOutline, pricetagsOutline, swapHorizontalOutline, trendingUpOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();

  const displayName = profile?.name ? `${profile.name} ${profile.surname ?? ''}`.trim() : '';
  const welcomeName = displayName || user?.email;

  const links = [
    { title: 'SMS Expense', subtitle: 'Link bank SMS messages to categories', url: '/app/sms-expense', icon: chatboxEllipsesOutline },
    { title: 'Expense', subtitle: 'Capture and view expenses', url: '/app/expense', icon: cardOutline },
    { title: 'Transfer', subtitle: 'Transfer between categories', url: '/app/transfer', icon: swapHorizontalOutline },
    { title: 'SMS Config', subtitle: 'Manage SMS matching settings', url: '/app/sms-config', icon: cogOutline },
    { title: 'Categories Setup', subtitle: 'Manage categories and budgets', url: '/app/categories-setup', icon: pricetagsOutline },
    { title: 'Expense Report', subtitle: 'View all transactions for a month', url: '/app/expense-report', icon: documentTextOutline },
    { title: 'Category Group Report', subtitle: 'Spent vs budget per category', url: '/app/category-group-report', icon: layersOutline },
    { title: 'Forecast', subtitle: 'Forecast what will be left this month', url: '/app/forecast', icon: trendingUpOutline },
    ...(isAdmin ? [{ title: 'User Management', subtitle: 'Manage users and budgets', url: '/app/user-management', icon: peopleOutline }] : []),
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={'primary'}>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className='ion-padding'>
        <h2>Welcome{welcomeName ? `, ${welcomeName}` : ''}</h2>

        {links.map((link) => (
          <IonCard key={link.url} routerLink={link.url}>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IonIcon icon={link.icon} size='large' color='primary' />
                <div>
                  <IonCardTitle>{link.title}</IonCardTitle>
                  <IonCardSubtitle>{link.subtitle}</IonCardSubtitle>
                </div>
              </div>
            </IonCardHeader>
          </IonCard>
        ))}
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
