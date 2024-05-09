import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDocs,
  getFirestore,
  QueryDocumentSnapshot,
  updateDoc,
  deleteDoc,
  DocumentReference,
} from "firebase/firestore";
import { Dish } from "./types";
import { migrateDish } from "./migrations";

export async function getDishes(): Promise<Dish[]> {
  const docs: QueryDocumentSnapshot<DocumentData>[] = [];
  const querySnapshot = await getDocs(collection(getFirestore(), "dishes"));
  querySnapshot.forEach((doc) => {
    docs.push(doc);
  });
  console.log(
    docs.map((doc) => doc.data()).map((dish) => ({ ...dish } as Dish))
  );
  return docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .map((dish) => migrateDish({ ...dish.data, id: dish.id } as Dish));
}

export async function saveDish(dish: Dish) {
  {
    let response;
    if (dish.id) {
      updateDoc(doc(getFirestore(), "dishes", dish.id), {
        ...dish,
      });
      response = doc(getFirestore(), "dishes", dish.id);
    } else {
      response = addDoc(collection(getFirestore(), "dishes"), {
        ...dish,
      });
    }
    return response;
  }
}

export async function deleteDish(id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), "dishes", id));
}
