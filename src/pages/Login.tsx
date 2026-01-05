import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, useIonRouter, IonButton, IonInput, useIonLoading, useIonAlert } from '@ionic/react'
import { FirebaseError } from 'firebase/app';
import { useForm } from 'react-hook-form';
import { FIREBASE_AUTH } from '../config/FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

    return (
        <IonPage>
           
            <IonHeader>
               <IonToolbar color={'primary'}>
                    <IonTitle>Fire Login</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className='ion-padding'>
                {/* <IonButton onClick={() => doLogin()} expand="full">
                    Login
                </IonButton> */}

                <form onSubmit={handleSubmit(onLogin)}>
                    <IonInput 
                        className={`ion-margin-bottom ${errors.email ? 'ion-invalid' : 'ion-valid'} ion-touched`}
                        label='Email' type='email' placeholder='kobusjonkerhome@gmail.com' fill='outline' label-placement='floating'  
                        {...register('email',{ required: true, pattern: { value: /\S+@\S+\.\S+/, message: 'Please enter a valid email' } })} errorText={errors.email?.message}/>


                    <IonInput 
                        className={`${errors.password ? 'ion-invalid' : 'ion-valid'} ion-touched`}
                        label='Password' type='password' placeholder='Password' fill='outline' label-placement='floating'  
                        {...register('password',{ required: true, minLength: { value: 6, message: 'Password must have at least 6 characters'} })} errorText={errors.password?.message}/>

                    

                    <IonButton type='submit' expand='block' disabled={!isValid} >
                        Login
                    </IonButton>

                    {/* <IonButton color={'secondary'} type='button' expand='block' disabled={!isValid} onClick={onRegister}>
                        Create Account
                    </IonButton>

                    <IonButton color={'tertiary'} type='button' expand='block' disabled={getValues('email') === ''} onClick={sendReset}>
                        Reset Password
                    </IonButton> */}

                </form>
                
            </IonContent>
        </IonPage>
    )
}

export default Login