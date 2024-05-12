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
} from "firebase/firestore";
import { Dish } from "./types";

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
    .map((dish) => ({ ...dish.data, id: dish.id } as Dish));
}

export async function saveDish(dish: Dish): Promise<string> {
  if (dish.id) {
    await updateDoc(doc(getFirestore(), "dishes", dish.id), {
      ...dish,
    });
    return dish.id;
  }
  return await addDoc(collection(getFirestore(), "dishes"), {
    ...dish,
  }).then((docRef) => docRef.id);
}

export async function deleteDish(id: Dish["id"]): Promise<void> {
  if (!id) return;
  await deleteDoc(doc(getFirestore(), "dishes", id));
}
