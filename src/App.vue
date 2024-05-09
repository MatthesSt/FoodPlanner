<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as storage from "./storage";
import { Dish } from "./types";
import * as db from "./firebase";

const dishes = ref<Dish[]>([]);
const user = ref(storage.getCurrentUser());

onMounted(async () => {
  dishes.value = await db.getDishes();
  if (dishes.value.length === 0) {
    dishes.value = storage.get("dishes") || [];
  }
});

function deleteDish(id: Dish["id"]) {
  const dish = dishes.value.find((d) => d.id === id);
  if (
    dish &&
    window.confirm(`Wollen Sie das Gericht "${dish.name}" wirklich löschen?`)
  ) {
    try {
      db.deleteDish(id as string);
      dishes.value = dishes.value.filter((d) => d.id !== id);
      storage.set("dishes", dishes.value);
    } catch (e) {
      console.error(e);
    }
  }
}

function showEditDish(id: Dish["id"]) {
  const dish = dishes.value.find((d) => d.id === id);
  if (dish) {
    currentDish.value = dish;
    showDishDialog.value = true;
  }
}

async function saveDish(dish: Dish) {
  dish = {
    ...dish,
    author: user.value,
  };
  try {
    dish.id = await db.saveDish(dish);
    if (!dishes.value.find((d) => d.id === dish.id)) {
      dishes.value.push(dish);
    } else {
      const index = dishes.value.findIndex((d) => d.id === dish.id);
      dishes.value[index] = dish;
    }
    storage.set("dishes", dishes.value);
    showDishDialog.value = false;
    currentDish.value = null;
  } catch (e) {
    console.error(e);
  }
}

const showDishDialog = ref(false);
function showCreateDish() {
  currentDish.value = {
    author: user.value,
    name: "",
    ingredients: [],
    description: "",
  };
  showDishDialog.value = true;
}

function addIngredient(dish: Dish) {
  dish.ingredients.push({
    id: dish.ingredients.length > 0 ? dish.ingredients.at(-1)!.id + 1 : 0,
    name: "",
    amount: "",
  });
}

function deleteIngredient(dish: Dish, ingredient: Dish["ingredients"][0]) {
  dish.ingredients = dish.ingredients.filter((i) => i.id !== ingredient.id);
}

const currentDish = ref<Dish | null>(null);

const editingUser = ref(false);
function saveUser() {
  storage.setCurrentUser(user.value);
}

const searchQuery = ref("");

const filteredDishes = computed(() =>
  dishes.value.filter(
    (d) =>
      d.name.includes(searchQuery.value) ||
      d.author.includes(searchQuery.value) ||
      d.description.includes(searchQuery.value) ||
      d.ingredients.some(
        (i) =>
          i.name.includes(searchQuery.value) ||
          i.amount.includes(searchQuery.value)
      )
  )
);
</script>

<template>
  <v-dialog
    v-if="currentDish"
    v-model="showDishDialog"
    @click.stop="showDishDialog = false"
  >
    <v-container>
      <v-card @click.stop="() => {}" :link="false">
        <v-form class="ma-2">
          <v-text-field
            variant="outlined"
            :label="currentDish.id"
            hide-details
            v-model="currentDish.name"
          />
          <v-divider class="my-3"></v-divider>
          <v-card-title>Rezept: </v-card-title>
          <v-textarea v-model="currentDish.description"></v-textarea>
          <v-divider class="my-3"></v-divider>
          <v-table height="300px" fixed-header>
            <thead>
              <tr class="bg-white">
                <td class="pa-1">Zutat</td>
                <td class="pa-1" style="width: 30%">Menge</td>
                <td style="width: 30px"></td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ingredient in currentDish.ingredients">
                <td class="pa-1">
                  <v-text-field hide-details v-model="ingredient.name" />
                </td>
                <td class="pa-1">
                  <v-text-field hide-details v-model="ingredient.amount" />
                </td>
                <td class="pa-0">
                  <v-btn
                    class="px-2 py-2"
                    style="min-width: 0"
                    color="primary"
                    @click.stop="deleteIngredient(currentDish, ingredient)"
                  >
                    <v-icon icon="mdi-delete"></v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="d-flex justify-space-between">
            <v-btn color="primary" @click.stop="addIngredient(currentDish)">
              <v-icon icon="mdi-plus"></v-icon>
            </v-btn>
            <v-btn color="success" @click.stop="saveDish(currentDish)"
              ><v-icon icon="mdi-check"></v-icon
            ></v-btn>
          </div>
        </v-form>
      </v-card>
    </v-container>
  </v-dialog>
  <div style="overflow: auto">
    <header
      style="height: 52px"
      class="bg-primary pa-2 d-flex justify-space-between align-center"
    >
      <span v-if="!editingUser" class="text-h6">{{ user.toUpperCase() }}</span>
      <span v-else style="width: 80%">
        <v-text-field hide-details v-model="user"></v-text-field>
      </span>
      <v-btn
        v-if="!editingUser"
        @click.stop="editingUser = !editingUser"
        color="primary"
        class="px-2 py-2"
        style="min-width: 0"
        ><v-icon icon="mdi-pen"></v-icon
      ></v-btn>
      <v-btn
        v-else
        @click.stop="
          () => {
            editingUser = !editingUser;
            saveUser();
          }
        "
        color="primary"
        class="px-2 py-2"
        style="min-width: 0"
        ><v-icon icon="mdi-check"></v-icon
      ></v-btn>
    </header>
    <main>
      <v-table fixed-header height="800px">
        <thead style="background-color: white">
          <tr>
            <td>
              <v-text-field
                variant="underlined"
                hide-details
                label="Gerichte"
                v-model="searchQuery"
                append-icon="mdi-magnify"
              ></v-text-field>
            </td>
            <td style="width: 168px">
              <div class="d-flex justify-end">
                <v-btn color="primary" @click.stop="showCreateDish">
                  <v-icon icon="mdi-plus"></v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dish in filteredDishes">
            <td>{{ dish.name }}</td>
            <td>
              <div class="d-flex justify-end">
                <v-btn color="error" @click.stop="deleteDish(dish.id)">
                  <v-icon icon="mdi-delete"></v-icon>
                </v-btn>
                <v-btn
                  color="secondary"
                  class="ms-2"
                  @click.stop="showEditDish(dish.id)"
                >
                  <v-icon icon="mdi-pen"></v-icon
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </main>
  </div>
</template>

<style scoped></style>
