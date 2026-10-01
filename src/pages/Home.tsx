import { IonButtons, IonButton, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar, useIonToast } from '@ionic/react';
import { cardOutline, chatboxEllipsesOutline, cogOutline, documentTextOutline, layersOutline, peopleOutline, pricetagsOutline, swapHorizontalOutline, trendingUpOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import AppFooter from '../components/AppFooter';
import { environment } from '../environments/environment';
import './Home.css';

const Home: React.FC = () => {
  const { user, profile, isAdmin, welcomePending, consumeWelcome } = useAuth();
  const [presentToast] = useIonToast();

  const displayName = profile?.name ? `${profile.name} ${profile.surname ?? ''}`.trim() : '';
  const welcomeName = displayName || user?.email;

  useEffect(() => {
    if (!welcomePending || !user || profile === undefined) {
      return;
    }

    presentToast({
      message: `Welcome back${welcomeName ? `, ${welcomeName}` : ''}`,
      duration: 2200,
      position: 'bottom',
      color: 'primary'
    });
    consumeWelcome?.();
  }, [consumeWelcome, presentToast, profile, user, welcomeName, welcomePending]);

  const links = [
    ...(environment.smsEnabled ? [{ title: 'SMS Expense', url: '/app/sms-expense', icon: chatboxEllipsesOutline }] : []),
    { title: 'Expense', url: '/app/expense', icon: cardOutline },
    { title: 'Transfer', url: '/app/transfer', icon: swapHorizontalOutline },
    ...(environment.smsEnabled ? [{ title: 'SMS Config', url: '/app/sms-config', icon: cogOutline }] : []),
    { title: 'Categories', url: '/app/categories-setup', icon: pricetagsOutline },
    { title: 'Expense Report', url: '/app/expense-report', icon: documentTextOutline },
    { title: 'Category Report', url: '/app/category-group-report', icon: layersOutline },
    { title: 'Forecast', url: '/app/forecast', icon: trendingUpOutline },
    ...(isAdmin ? [{ title: 'Users', url: '/app/user-management', icon: peopleOutline }] : []),
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
        <div className='home-action-grid'>
          {links.map((link) => (
            <IonButton key={link.url} className='home-action' routerLink={link.url} fill='outline' aria-label={link.title}>
              <span className='home-action-content'>
                <IonIcon icon={link.icon} aria-hidden='true' />
                <span className='home-action-label'>{link.title}</span>
              </span>
            </IonButton>
          ))}
        </div>
      </IonContent>

      <AppFooter />
    </IonPage>
  );
};

export default Home;
