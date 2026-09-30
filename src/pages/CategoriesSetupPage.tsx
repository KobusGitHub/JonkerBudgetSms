import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCheckbox, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonPage, IonSpinner, IonText, IonTitle, IonToggle, IonToolbar, useIonActionSheet, useIonAlert, useIonToast } from '@ionic/react';
import { collection, doc, DocumentData, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { addOutline, barChartOutline, closeOutline, createOutline, pricetagOutline, star, trashOutline } from 'ionicons/icons';
import { FIREBASE_DB } from '../config/FirebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CategoryModel } from '../models/CategoryModel';
import { ExpenseModel } from '../models/ExpenseModel';
import { currencyFormatter, sortCategories } from '../shared/utils';
import './CategoriesSetupPage.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthTotal {
    month: string;
    year: number;
    total: number;
    selected: boolean;
}

const emptyCategory: CategoryModel = {
    categoryName: '',
    budget: 0,
    guidId: '',
    isDeleted: false,
    isFavourite: false,
    shareToken: ''
};

const CategoriesSetupPage: React.FC = () => {
    const { user } = useAuth();
    const [presentToast] = useIonToast();
    const [presentAlert] = useIonAlert();
    const [presentActionSheet] = useIonActionSheet();

    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [category, setCategory] = useState<CategoryModel>(emptyCategory);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [historyCategory, setHistoryCategory] = useState<CategoryModel | null>(null);
    const [history, setHistory] = useState<MonthTotal[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const selectedHistory = history.filter(h => h.selected);
    const suggestedBudget = selectedHistory.length
        ? selectedHistory.reduce((sum, h) => sum + h.total, 0) / selectedHistory.length
        : 0;

    const toggleHistoryMonth = (index: number, checked: boolean) => {
        setHistory(prev => prev.map((h, i) => i === index ? { ...h, selected: checked } : h));
    };

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(FIREBASE_DB, 'category'),
            where('isDeleted', '==', false),
            where('shareToken', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot: DocumentData) => {
            const cats = querySnapshot.docs.map((d: DocumentData) => ({
                guidId: d.id,
                ...d.data()
            }));
            setCategories(sortCategories(cats));
        });

        return unsubscribe;
    }, [user?.uid]);

    const openModal = (cat: CategoryModel) => {
        setCategory(cat);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCategory(emptyCategory);
    };

    const saveCategory = async () => {
        const name = category.categoryName.trim();
        if (!name) {
            presentToast({ message: 'Category name is required', duration: 2000, color: 'danger' });
            return;
        }

        const duplicate = categories.some(c =>
            c.guidId !== category.guidId && c.categoryName.trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            presentToast({ message: 'A category with that name already exists', duration: 2000, color: 'danger' });
            return;
        }

        const categoryCollection = collection(FIREBASE_DB, 'category');

        if (category.guidId) {
            await updateDoc(doc(categoryCollection, category.guidId), {
                categoryName: name,
                budget: Number(category.budget) || 0,
                isFavourite: category.isFavourite
            });
            presentToast({ message: 'Category Updated Successfully!', duration: 2000, color: 'success' });
        } else {
            const newDocRef = doc(categoryCollection);
            const recToSave: CategoryModel = {
                ...category,
                categoryName: name,
                budget: Number(category.budget) || 0,
                guidId: newDocRef.id,
                shareToken: user?.uid ?? ''
            };
            await setDoc(newDocRef, recToSave);
            presentToast({ message: 'Category Saved Successfully!', duration: 2000, color: 'success' });
        }

        closeModal();
    };

    // Soft delete so existing expenses still reference a valid category
    const deleteCategory = async (cat: CategoryModel) => {
        await updateDoc(doc(collection(FIREBASE_DB, 'category'), cat.guidId), { isDeleted: true });
        presentToast({ message: 'Category Deleted Successfully!', duration: 2000, color: 'success' });
    };

    const openHistory = async (cat: CategoryModel) => {
        setHistoryCategory(cat);
        setHistory([]);
        setIsHistoryLoading(true);

        const now = new Date();
        const periods: MonthTotal[] = Array.from({ length: 5 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return { month: MONTHS[d.getMonth()], year: d.getFullYear(), total: 0, selected: true };
        });
        const years = Array.from(new Set(periods.map(p => p.year)));

        try {
            const q = query(collection(FIREBASE_DB, 'expense'),
                where('shareToken', '==', user?.uid),
                where('categoryGuidId', '==', cat.guidId),
                where('year', 'in', years)
            );
            const snapshot = await getDocs(q);

            snapshot.docs.forEach(d => {
                const exp = d.data() as ExpenseModel;
                const period = periods.find(p =>
                    p.year === exp.year && p.month.toLowerCase() === exp.month?.toLowerCase()
                );
                if (period) period.total += Number(exp.expenseValue) || 0;
            });

            setHistory(periods);
        } catch (error) {
            console.error('History fetch failed:', error);
            presentToast({ message: 'Failed to load history', duration: 2000, color: 'danger' });
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const openActionSheet = (cat: CategoryModel) => {
        presentActionSheet({
            header: cat.categoryName,
            subHeader: `Budget: ${currencyFormatter.format(cat.budget || 0)}`,
            cssClass: 'category-action-sheet',
            buttons: [
                { text: 'Update', icon: createOutline, cssClass: 'action-update', handler: () => openModal(cat) },
                { text: 'History', icon: barChartOutline, cssClass: 'action-history', handler: () => { openHistory(cat); } },
                {
                    text: 'Delete',
                    icon: trashOutline,
                    role: 'destructive',
                    handler: () => {
                        presentAlert({
                            header: 'Confirm Delete',
                            message: `Are you sure you want to delete ${cat.categoryName}?`,
                            buttons: [
                                { text: 'Cancel', role: 'cancel' },
                                { text: 'Confirm', role: 'confirm', handler: () => { deleteCategory(cat); } }
                            ]
                        });
                    }
                },
                { text: 'Cancel', icon: closeOutline, role: 'cancel' }
            ]
        });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color={'primary'}>
                    <IonButtons slot='start'>
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Categories Setup</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className='ion-padding'>
                {categories.map((cat) => (
                    <IonCard key={cat.guidId} button={true} onClick={() => openActionSheet(cat)}>
                        <IonCardHeader>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <IonCardSubtitle style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <IonIcon icon={pricetagOutline} size='small' />
                                    {cat.isFavourite && <IonIcon icon={star} color='warning' size='small' />}
                                    {cat.categoryName}
                                </IonCardSubtitle>
                                <IonText color='secondary' style={{ fontSize: '13px' }}>
                                    {currencyFormatter.format(cat.budget || 0)}
                                </IonText>
                            </div>
                        </IonCardHeader>
                    </IonCard>
                ))}

                <IonModal isOpen={isModalOpen} onDidDismiss={closeModal} breakpoints={[0, 0.5, 1]} initialBreakpoint={0.5}>
                    <IonHeader>
                        <IonToolbar color={'secondary'}>
                            <IonButtons slot='start'>
                                <IonButton onClick={closeModal}>
                                    <IonIcon slot='icon-only' icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>{category.guidId ? 'Edit Category' : 'Add Category'}</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className='ion-padding'>
                        <IonItem>
                            <IonInput
                                label='Category Name'
                                labelPlacement='floating'
                                value={category.categoryName}
                                onIonInput={(e) => setCategory(prev => ({ ...prev, categoryName: e.detail.value ?? '' }))}
                            />
                        </IonItem>
                        <IonItem>
                            <IonInput
                                label='Budget'
                                labelPlacement='floating'
                                type='number'
                                inputmode='decimal'
                                value={category.budget}
                                onIonInput={(e) => setCategory(prev => ({ ...prev, budget: parseFloat(e.detail.value ?? '') || 0 }))}
                            />
                        </IonItem>
                        <IonItem>
                            <IonToggle
                                checked={category.isFavourite}
                                onIonChange={(e) => setCategory(prev => ({ ...prev, isFavourite: e.detail.checked }))}
                            >
                                Favourite
                            </IonToggle>
                        </IonItem>
                        <IonButton expand='block' className='ion-margin-top' onClick={saveCategory}>
                            Save Category
                        </IonButton>
                    </IonContent>
                </IonModal>

                <IonModal isOpen={historyCategory !== null} onDidDismiss={() => setHistoryCategory(null)} breakpoints={[0, 0.67]} initialBreakpoint={0.67}>
                    <IonHeader>
                        <IonToolbar color={'secondary'}>
                            <IonButtons slot='start'>
                                <IonButton onClick={() => setHistoryCategory(null)}>
                                    <IonIcon slot='icon-only' icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>History: {historyCategory?.categoryName}</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className='ion-padding'>
                        {isHistoryLoading ? (
                            <div className='ion-text-center'><IonSpinner /></div>
                        ) : (
                            <>
                            <IonList>
                                {history.map((h, index) => (
                                    <IonItem key={`${h.year}-${h.month}`} button detail={false} onClick={() => toggleHistoryMonth(index, !h.selected)}>
                                        <IonCheckbox
                                            slot='start'
                                            checked={h.selected}
                                            style={{ pointerEvents: 'none' }}
                                            aria-label={`Include ${h.month} ${h.year}`}
                                        />
                                        <IonLabel>{h.month} {h.year}</IonLabel>
                                        <IonText slot='end' color={historyCategory && h.total > historyCategory.budget ? 'danger' : 'secondary'}>
                                            {currencyFormatter.format(h.total)}
                                        </IonText>
                                    </IonItem>
                                ))}
                            </IonList>

                            <IonItem lines='none' className='ion-margin-top'>
                                <IonLabel>
                                    <strong>Current Budget</strong>
                                </IonLabel>
                                <IonText slot='end'>
                                    <strong>{currencyFormatter.format(historyCategory?.budget || 0)}</strong>
                                </IonText>
                            </IonItem>

                            <IonItem lines='none' style={{ paddingBottom: '40px' }}>
                                <IonLabel>
                                    <strong>Suggested Budget</strong>
                                    <p>Average of {selectedHistory.length} selected month{selectedHistory.length === 1 ? '' : 's'}</p>
                                </IonLabel>
                                <IonText slot='end' color='primary'>
                                    <strong>{currencyFormatter.format(suggestedBudget)}</strong>
                                </IonText>
                            </IonItem>
                            </>
                        )}
                    </IonContent>
                </IonModal>

                <IonFab vertical='bottom' horizontal='end' slot='fixed'>
                    <IonFabButton onClick={() => openModal(emptyCategory)}>
                        <IonIcon icon={addOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
            </IonContent>

            <IonFooter style={{ height: '24px' }}>
                <IonToolbar>
                    <div style={{ paddingBottom: ' 30px', height: '24px', lineHeight: '24px', fontSize: '12px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', color: '#6b7dba' }}>
                        Home Budget
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default CategoriesSetupPage;
