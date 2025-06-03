import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyAQuSZ1Jiavf54VQXLfFou3FICgl5hHqBQ",
    authDomain: "walkerhoilc.firebaseapp.com",
    projectId: "walkerhoilc",
    storageBucket: "walkerhoilc.firebasestorage.app",
    messagingSenderId: "134641331408",
    appId: "1:134641331408:web:37c9caee9c667e77d642d5",
    measurementId: "G-F93MKVLCCB"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스 생성
export const db = getFirestore(app);

// 데이터 추가 함수
export const addData = async (collectionName: string, data: any) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error adding document: ", error);
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
        console.error("Error getting documents: ", error);
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
        console.error("Error getting document: ", error);
        throw error;
    }
};

// 문서 업데이트
export const updateDocument = async (collectionName: string, docId: string, data: any) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, data);
        return { id: docId, ...data };
    } catch (error) {
        console.error("Error updating document: ", error);
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
        console.error("Error deleting document: ", error);
        throw error;
    }
};