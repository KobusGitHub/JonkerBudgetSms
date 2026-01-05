import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import { App as CapacitorApp } from '@capacitor/app';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Page1 from './pages/Page1';

import { AuthenticatedRoute, AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';


setupIonicReact();

const App: React.FC = () => {

const { initialized } = useAuth();
if(!initialized) <></>;

// CapacitorApp.addListener('backButton', () => {
//   if (location.pathname === '/app/home') {
//     // On root page → exit app
//     CapacitorApp.exitApp();
//   } else {
//     // On subpages → go back
//     window.history.back();
//   }
// });

return (
  <AuthProvider>
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        

        <Route exact path="/" component={Login} />
        <AuthenticatedRoute>
          {/* <Route exact path="/app/home" component={Home} /> */}
          <Route path="/app" component={Menu} />
        </AuthenticatedRoute>
        {/* <Route path="/app" component={Menu} /> */}
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
  </AuthProvider>
)
};

export default App;
