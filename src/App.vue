<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as storage from "./storage";
import { Dish } from "./types";
import * as db from "./firebase";

const dishes = ref<Dish[]>([]);
const user = ref(storage.getCurrentUser());

onMounted(async () => {
  dishes.value = await db.getDishes();
  const localDishes = storage.getDishes() || [];
  for (const dish of localDishes) {
    const dbDish = dishes.value.find((d) => d.id === dish.id);
    if (!dish.id || (dbDish && dbDish.updated_at < dish.updated_at)) {
      saveDish(dish);
    }
    if (dbDish && dbDish.updated_at > dish.updated_at) {
      storage.setDishes([
        ...localDishes.filter((d) => d.id != dish.id),
        dbDish,
      ]);
    }
  }
});

function deleteDish(dish: Dish) {
  const dbDish = dishes.value.find((d) => d.id === dish.id);
  if (
    dish &&
    window.confirm(`Wollen Sie das Gericht "${dish.name}" wirklich löschen?`)
  ) {
    try {
      if (dbDish && dbDish.id) {
        db.deleteDish(dbDish.id);
      }
      dishes.value = dishes.value.filter((d) => d !== dish);
      storage.setDishes(dishes.value);
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
    updated_at: new Date().valueOf(),
  };
  try {
    dish.id = (await db.saveDish(dish)).id;
  } catch (e) {
    console.error("save went wrong", e);
  } finally {
    if (!dishes.value.find((d) => d.id === dish.id)) {
      dishes.value.push(dish);
    } else {
      const index = dishes.value.findIndex((d) => d.id === dish.id);
      dishes.value[index] = dish;
    }
    storage.setDishes(dishes.value);
    showDishDialog.value = false;
    currentDish.value = null;
  }
}

const showDishDialog = ref(false);
function showCreateDish() {
  currentDish.value = {
    author: user.value,
    name: "",
    ingredients: [],
    description: "",
    updated_at: new Date().valueOf(),
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
  if (
    dish &&
    window.confirm(`Sicher, dass Sie "${ingredient.name}" löschen wollen?`)
  )
    dish.ingredients = dish.ingredients.filter((i) => i.id !== ingredient.id);
}

const currentDish = ref<Dish | null>(null);

const editingUser = ref(false);
function saveUser() {
  storage.setCurrentUser(user.value);
}

const searchedIngredients = ref<string[]>([]);

const filteredDishes = computed(() =>
  dishes.value
    .filter((d) =>
      searchedIngredients.value.every((i) =>
        d.ingredients.some((di) => di.name.includes(i))
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name))
);

const searchableIngredients = computed(() =>
  [
    ...new Set(
      dishes.value.flatMap((d) =>
        d.ingredients.map((i) => i.name[0].toUpperCase() + i.name.slice(1))
      )
    ),
  ].sort((a, b) => a.localeCompare(b))
);

const authors = computed(() =>
  Array.from(new Set(dishes.value.map((d) => d.author)))
);
</script>

<template>
  <v-dialog
    v-if="currentDish"
    v-model="showDishDialog"
    @click.stop="showDishDialog = false"
  >
    <v-card @click.stop="() => {}" :link="false">
      <v-form class="ma-2">
        <v-text-field
          variant="outlined"
          label="Name des Gerichts"
          hide-details
          v-model="currentDish.name"
        />
        <v-divider class="my-3"></v-divider>
        <v-textarea
          label="REZEPT"
          hide-details
          v-model="currentDish.description"
        ></v-textarea>
        <v-divider class="my-3"></v-divider>
        <v-table>
          <thead>
            <tr class="bg-white">
              <td class="pa-1">Zutat</td>
              <td class="pa-1">Menge</td>
              <td style="width: 0" class="pa-0"></td>
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
                  class="px-0 py-2"
                  style="min-width: 0"
                  color="error"
                  @click.stop="deleteIngredient(currentDish, ingredient)"
                >
                  <v-icon icon="mdi-close"></v-icon>
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
  </v-dialog>
  <v-container class="pa-0">
    <div style="overflow: auto">
      <header
        style="height: 52px"
        class="bg-primary pa-2 d-flex justify-space-between align-center"
      >
        <span v-if="!editingUser" class="text-h6">{{
          user.toUpperCase()
        }}</span>
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
                <v-select
                  :items="searchableIngredients"
                  v-model="searchedIngredients"
                  multiple
                  hide-details
                  append-icon="mdi-close"
                  @click:append="searchedIngredients = []"
                ></v-select>
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
            <template v-for="author of authors">
              <tr>
                <td>Gerichte von: {{ author }}</td>
                <td></td>
              </tr>
              <template
                v-for="dish in filteredDishes.filter((d) => d.author == author)"
              >
                <tr>
                  <td>{{ dish.name }}</td>
                  <td>
                    <div class="d-flex justify-end">
                      <v-btn color="error" @click.stop="deleteDish(dish)">
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
              </template>
            </template>
          </tbody>
        </v-table>
      </main>
    </div>
  </v-container>
</template>

<style scoped></style>
