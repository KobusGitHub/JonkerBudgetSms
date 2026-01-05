import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

const BackButtonHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    let listenerHandle: any;

    const setup = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', async () => {
        // 1️⃣ Find all modals
        const modals = Array.from(document.querySelectorAll('ion-modal')) as HTMLIonModalElement[];

        // 2️⃣ Check if any modal is open
        const openModal = modals.find(m => m.isOpen); // ✅ just check boolean
        if (openModal) {
          await openModal.dismiss();
          return; // stop here
        }

        // 3️⃣ Exit app on Home/Login
        const exitRoutes = ['/app/home', '/'];
        if (exitRoutes.includes(location.pathname)) {
          CapacitorApp.exitApp();
          return;
        }

        // 4️⃣ Otherwise go back
        window.history.back();
      });
    };

    setup();

    return () => {
      listenerHandle?.remove?.();
    };
  }, [location.pathname]);

  return null;
};

export default BackButtonHandler;
