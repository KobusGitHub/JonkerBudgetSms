import { IonBadge, IonButton, IonButtons, IonCard, IonCardHeader, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonMenuButton, IonModal, IonPage, IonText, IonTitle, IonToggle, IonToolbar, useIonActionSheet, useIonAlert, useIonToast } from '@ionic/react';
import { collection, deleteDoc, doc, DocumentData, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { addOutline, closeOutline, createOutline, keyOutline, personCircleOutline, trashOutline } from 'ionicons/icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { UserModel } from '../models/UserModel';
import './CategoriesSetupPage.css';

const emptyUser: UserModel = {
    guidId: '',
    name: '',
    surname: '',
    email: '',
    budget: 0,
    isAdmin: false,
    lastActive: '',
    shareToken: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [presentToast] = useIonToast();
    const [presentAlert] = useIonAlert();
    const [presentActionSheet] = useIonActionSheet();

    const [users, setUsers] = useState<UserModel[]>([]);
    const [editUser, setEditUser] = useState<UserModel>(emptyUser);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentEmail = user?.email?.toLowerCase() ?? '';
    const me = users.find(u => u.email?.toLowerCase() === currentEmail);
    // UI gate only; Firestore rules must enforce this as well
    const canEdit = me?.isAdmin === true;

    useEffect(() => {
        if (!user?.uid) return;

        return onSnapshot(collection(FIREBASE_DB, 'user'), (snapshot: DocumentData) => {
            const rows: UserModel[] = snapshot.docs.map((d: DocumentData) => ({ ...d.data(), guidId: d.id }));
            rows.sort((a, b) => `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`));
            setUsers(rows);
        }, (error) => {
            console.error('User fetch failed:', error);
            presentToast({ message: 'Failed to load users', duration: 2000, color: 'danger' });
        });
    }, [user?.uid]);

    const openModal = (u: UserModel) => {
        setEditUser(u);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditUser(emptyUser);
    };

    const saveUser = async () => {
        const name = editUser.name.trim();
        const surname = editUser.surname.trim();
        const email = editUser.email.trim().toLowerCase();

        if (!name || !email) {
            presentToast({ message: 'Name and email are required', duration: 2000, color: 'danger' });
            return;
        }
        if (!EMAIL_PATTERN.test(email)) {
            presentToast({ message: 'Please enter a valid email', duration: 2000, color: 'danger' });
            return;
        }
        if (users.some(u => u.guidId !== editUser.guidId && u.email?.toLowerCase() === email)) {
            presentToast({ message: 'A user with that email already exists', duration: 2000, color: 'danger' });
            return;
        }
        if (editUser.guidId === me?.guidId && !editUser.isAdmin) {
            presentToast({ message: 'You cannot remove your own admin rights', duration: 2000, color: 'danger' });
            return;
        }

        const fields = {
            name,
            surname,
            email,
            isAdmin: editUser.isAdmin
        };
        const userCollection = collection(FIREBASE_DB, 'user');

        try {
            if (editUser.guidId) {
                await updateDoc(doc(userCollection, editUser.guidId), fields);
                presentToast({ message: 'User Updated Successfully!', duration: 2000, color: 'success' });
            } else {
                const newDocRef = doc(userCollection);
                const recToSave: UserModel = {
                    ...emptyUser,
                    ...fields,
                    guidId: newDocRef.id,
                    shareToken: user?.uid ?? ''
                };
                await setDoc(newDocRef, recToSave);
                presentToast({ message: 'User Added Successfully!', duration: 2000, color: 'success' });
            }
            closeModal();
        } catch (error) {
            console.error('User save failed:', error);
            presentToast({ message: 'Failed to save user', duration: 2000, color: 'danger' });
        }
    };

    const deleteUser = async (u: UserModel) => {
        try {
            await deleteDoc(doc(collection(FIREBASE_DB, 'user'), u.guidId));
            presentToast({ message: 'User Deleted Successfully!', duration: 2000, color: 'success' });
        } catch (error) {
            console.error('User delete failed:', error);
            presentToast({ message: 'Failed to delete user', duration: 2000, color: 'danger' });
        }
    };

    const sendResetEmail = async (u: UserModel) => {
        try {
            await sendPasswordResetEmail(FIREBASE_AUTH, u.email);
            presentToast({ message: `Password reset email sent to ${u.email}`, duration: 2500, color: 'success' });
        } catch (error) {
            console.error('Password reset failed:', error);
            presentToast({ message: 'Failed to send password reset email', duration: 2000, color: 'danger' });
        }
    };

    const openActionSheet = (u: UserModel) => {
        if (!canEdit) return;

        const isMe = u.guidId === me?.guidId;
        presentActionSheet({
            header: `${u.name} ${u.surname}`.trim(),
            subHeader: u.email,
            cssClass: 'category-action-sheet',
            buttons: [
                { text: 'Update', icon: createOutline, cssClass: 'action-update', handler: () => openModal(u) },
                {
                    text: 'Reset Password',
                    icon: keyOutline,
                    cssClass: 'action-history',
                    handler: () => {
                        presentAlert({
                            header: 'Reset Password',
                            message: `Send a password reset email to ${u.email}?`,
                            buttons: [
                                { text: 'Cancel', role: 'cancel' },
                                { text: 'Send', handler: () => { sendResetEmail(u); } }
                            ]
                        });
                    }
                },
                ...(isMe ? [] : [{
                    text: 'Delete',
                    icon: trashOutline,
                    role: 'destructive',
                    handler: () => {
                        presentAlert({
                            header: 'Confirm Delete',
                            message: `Are you sure you want to delete ${u.name} ${u.surname}?`,
                            buttons: [
                                { text: 'Cancel', role: 'cancel' },
                                { text: 'Confirm', role: 'confirm', handler: () => { deleteUser(u); } }
                            ]
                        });
                    }
                }]),
                { text: 'Cancel', icon: closeOutline, role: 'cancel' }
            ]
        });
    };

    const formatLastActive = (value: string) => {
        if (!value) return 'Never';
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>User Management</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className='ion-padding'>
                {!canEdit && users.length > 0 && (
                    <IonText color='medium'>
                        <p className='ion-text-center' style={{ fontSize: '12px' }}>Only admins can add or change users.</p>
                    </IonText>
                )}

                {users.map(u => (
                    <IonCard key={u.guidId} button={canEdit} onClick={() => openActionSheet(u)}>
                        <IonCardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IonIcon icon={personCircleOutline} color='primary' style={{ fontSize: '36px' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 600 }}>
                                        {u.name} {u.surname}
                                        {u.isAdmin && <IonBadge color='secondary'>Admin</IonBadge>}
                                        {u.guidId === me?.guidId && <IonBadge color='medium'>You</IonBadge>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--ion-color-medium)', overflowWrap: 'anywhere' }}>{u.email}</div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', marginTop: '4px' }}>
                                        <span style={{ color: 'var(--ion-color-medium)' }}>Last active: {formatLastActive(u.lastActive)}</span>
                                    </div>
                                </div>
                            </div>
                        </IonCardHeader>
                    </IonCard>
                ))}

                <IonModal isOpen={isModalOpen} onDidDismiss={closeModal} breakpoints={[0, 0.67]} initialBreakpoint={0.67}>
                    <IonHeader>
                        <IonToolbar color={'secondary'}>
                            <IonButtons slot='start'>
                                <IonButton onClick={closeModal}>
                                    <IonIcon slot='icon-only' icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>{editUser.guidId ? 'Edit User' : 'Add User'}</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className='ion-padding'>
                        <IonItem>
                            <IonInput label='Name' labelPlacement='floating' value={editUser.name}
                                onIonInput={(e) => setEditUser(prev => ({ ...prev, name: e.detail.value ?? '' }))} />
                        </IonItem>
                        <IonItem>
                            <IonInput label='Surname' labelPlacement='floating' value={editUser.surname}
                                onIonInput={(e) => setEditUser(prev => ({ ...prev, surname: e.detail.value ?? '' }))} />
                        </IonItem>
                        <IonItem>
                            <IonInput label='Email' labelPlacement='floating' type='email' value={editUser.email}
                                onIonInput={(e) => setEditUser(prev => ({ ...prev, email: e.detail.value ?? '' }))} />
                        </IonItem>
                        <IonItem>
                            <IonToggle checked={editUser.isAdmin}
                                onIonChange={(e) => setEditUser(prev => ({ ...prev, isAdmin: e.detail.checked }))}>
                                Admin
                            </IonToggle>
                        </IonItem>
                        <IonButton expand='block' className='ion-margin-top' onClick={saveUser}>
                            Save User
                        </IonButton>
                    </IonContent>
                </IonModal>

                {canEdit && (
                    <IonFab vertical='bottom' horizontal='end' slot='fixed'>
                        <IonFabButton onClick={() => openModal(emptyUser)}>
                            <IonIcon icon={addOutline}></IonIcon>
                        </IonFabButton>
                    </IonFab>
                )}
            </IonContent>

            <IonFooter style={{ height: '24px' }}>
                <IonToolbar>
                    <div style={{ paddingBottom: ' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', color: '#6b7dba' }}>
                        Jonker Budget Home
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default UserManagementPage;
