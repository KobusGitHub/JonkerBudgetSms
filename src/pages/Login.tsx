import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, useIonRouter, IonButton, IonInput, useIonLoading, useIonAlert, IonIcon, IonCard, IonCardContent } from '@ionic/react'
import { walletOutline } from 'ionicons/icons';
import './Login.css';
import { FirebaseError } from 'firebase/app';
import { useForm } from 'react-hook-form';
import { FIREBASE_AUTH } from '../config/FirebaseConfig';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';


type FormValues = {
    email: string; // jacobusjonker@gmail.com
    password: string; // Walle55
};

const Login: React.FC = () => {
    const { register, handleSubmit, formState: { errors, isValid}, getValues } = useForm<FormValues>({mode: 'onBlur'}); 

    const navigation = useIonRouter();
    const [ show, hide ] = useIonLoading();
    const [ present, dismiss ] = useIonAlert();

    const { user } = useAuth();
    const router = useIonRouter();

    useEffect(() => {
        if(user) {
            router.push('/app/home', 'forward', 'replace');
        }
    }, [user]);

    // const doLogin = () => {
    //     navigation.push('/app', 'root', 'replace');
    // }

    const onLogin = async (data: FormValues) => {
        const { email, password } = data;

        await show();
        try {
            const user = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
            console.log(user);
        } catch (error) {
            if(error instanceof FirebaseError){
                present({
                    header: 'Login Failed',
                    message: error.message,
                    buttons: ['OK']
                })
            }
        } finally {
            await hide();
        }
    }

    const sendReset = async (email: string) => {
        const trimmed = email.trim();
        if (!/\S+@\S+\.\S+/.test(trimmed)) {
            present({ header: 'Reset Password', message: 'Please enter a valid email address.', buttons: ['OK'] });
            return;
        }

        await show();
        try {
            await sendPasswordResetEmail(FIREBASE_AUTH, trimmed);
        } catch (error) {
            // Don't reveal whether the account exists
            if (!(error instanceof FirebaseError) || error.code !== 'auth/user-not-found') {
                console.error('Password reset failed:', error);
                present({ header: 'Reset Password', message: 'Could not send the reset email. Please try again later.', buttons: ['OK'] });
                return;
            }
        } finally {
            await hide();
        }

        present({
            header: 'Check your email',
            message: `If an account exists for ${trimmed}, a password reset link has been sent.`,
            buttons: ['OK']
        });
    }

    const promptReset = () => {
        present({
            header: 'Reset Password',
            message: 'Enter your email and we will send you a reset link.',
            inputs: [{ name: 'email', type: 'email', placeholder: 'Email', value: getValues('email') ?? '' }],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                { text: 'Send', handler: (data) => { sendReset(data.email ?? ''); } }
            ]
        });
    }

    return (
        <IonPage>
           
            <IonHeader>
               <IonToolbar color={'primary'}>
                    <IonTitle>Jonker Budget Login</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className='login-content'>
                <div className='login-wrapper'>
                    <div className='login-brand'>
                        <div className='login-logo'>
                            <IonIcon icon={walletOutline} />
                        </div>
                        <h1>Jonker Budget</h1>
                        <p>Sign in to manage your budget</p>
                    </div>

                    <IonCard className='login-card'>
                        <IonCardContent>
                            <form onSubmit={handleSubmit(onLogin)}>
                                <IonInput 
                                    className={`login-input ${errors.email ? 'ion-invalid' : 'ion-valid'} ion-touched`}
                                    label='Email' type='email' placeholder='you@example.com' fill='outline' label-placement='floating'  
                                    {...register('email',{ required: true, pattern: { value: /\S+@\S+\.\S+/, message: 'Please enter a valid email' } })} errorText={errors.email?.message}/>

                                <IonInput 
                                    className={`login-input ${errors.password ? 'ion-invalid' : 'ion-valid'} ion-touched`}
                                    label='Password' type='password' placeholder='Password' fill='outline' label-placement='floating'  
                                    {...register('password',{ required: true, minLength: { value: 6, message: 'Password must have at least 6 characters'} })} errorText={errors.password?.message}/>

                                <IonButton className='login-button' type='submit' expand='block' shape='round' disabled={!isValid}>
                                    Login
                                </IonButton>

                                <IonButton className='login-forgot' type='button' fill='clear' size='small' expand='block' onClick={promptReset}>
                                    Forgot password?
                                </IonButton>
                            </form>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    )
}

export default Login