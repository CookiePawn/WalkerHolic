import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { 
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID 
} from '@env';

// Firebase 설정
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스 생성
export const db = getFirestore(app);

// 데이터 추가 함수
export const addData = async (collectionName: string, data: any) => {
    console.log('addData', collectionName, data);
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        throw error;
    }
};

// 컬렉션의 모든 데이터 가져오기
export const getCollectionData = async (collectionName: string) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

// 특정 문서 가져오기
export const getDocument = async (collectionName: string, docId: string) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        throw error;
    }
};

// 문서 업데이트 또는 생성
export const updateDocument = async (collectionName: string, data: any) => {
    try {
        // userUid와 date로 문서 ID 생성
        const docId = `${data.userUid}_${data.date}`;
        const docRef = doc(db, collectionName, docId);
        
        // 문서가 존재하는지 확인
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 문서가 존재하면 걸음 수가 더 큰 경우에만 업데이트
            const existingData = docSnap.data();
            if (data.steps > existingData.steps) {
                await updateDoc(docRef, {
                    steps: data.steps,
                    timestamp: data.timestamp
                });
            }
            return { id: docId, ...data };
        } else {
            // 새로운 데이터 추가 (지정된 ID로)
            await setDoc(docRef, data);
            return { id: docId, ...data };
        }
    } catch (error) {
        throw error;
    }
};

// 문서 삭제
export const deleteDocument = async (collectionName: string, docId: string) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        throw error;
    }
};