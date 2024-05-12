<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import * as storage from "./storage";
import { Dish } from "./types";
import * as db from "./firebase";

const dishes = ref<Dish[]>([]);
const user = ref(storage.getCurrentUser());

const tableContentHeight = window.innerHeight - 56 + "px";

const currentDish = ref<Dish | null>(null);
const currentDishErrors = ref({
  name: "",
  description: "",
  reset: function () {
    this.name = "";
    this.description = "";
  },
});

watch(
  currentDish,
  (dish) => {
    if (
      dish &&
      dish.ingredients.every((i) => i.name !== "" && i.amount !== "")
    ) {
      addIngredient(dish);
    }
  },
  { deep: true }
);

onMounted(async () => {
  dishes.value = await db.getDishes();
  if (dishes.value.length === 0) {
    dishes.value = storage.get("dishes") || [];
  }
});

function deleteDish(dish: Dish) {
  if (
    window.confirm(`Wollen Sie das Gericht "${dish.name}" wirklich löschen?`)
  ) {
    try {
      db.deleteDish(dish.id as string);
      dishes.value = dishes.value.filter((d) => d.id !== dish.id);
      storage.set("dishes", dishes.value);
    } catch (e) {
      console.error(e);
    }
  }
}

async function saveDish() {
  if (!currentDish.value) return;
  currentDishErrors.value.reset();
  if (currentDish.value.name === "") {
    currentDishErrors.value.name = "Bitte geben Sie einen Namen ein.";
  }
  if (currentDish.value.description === "") {
    currentDishErrors.value.description =
      "Bitte geben Sie eine Beschreibung ein.";
  }
  if (currentDishErrors.value.name || currentDishErrors.value.description)
    return;

  const dish = {
    ...currentDish.value,
    ingredients: currentDish.value.ingredients.filter(
      (i) => i.name !== "" && i.amount !== ""
    ),
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
function showEditDish(dish: Dish) {
  currentDish.value = dish;
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

const editingUser = ref(false);
function saveUser() {
  storage.setCurrentUser(user.value);
}

const searchedIngredients = ref<string[]>([]);

const filteredDishes = computed(() =>
  dishes.value
    .filter(
      (dish) =>
        searchedIngredients.value.every((ingredient) =>
          dish.ingredients.some((di) => di.name.includes(ingredient))
        ) ||
        dish.ingredients.every((ingredient) =>
          searchedIngredients.value.includes(ingredient.name)
        )
    )
    .sort((a, b) => a.name.localeCompare(b.name))
);

const searchableIngredients = computed(() =>
  [
    ...new Set(dishes.value.flatMap((d) => d.ingredients.map((i) => i.name))),
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
    <v-card @click.stop="() => {}" :link="false" class="bg-black">
      <v-form class="ma-2" @submit.prevent="saveDish">
        <v-text-field
          variant="outlined"
          label="Name des Gerichts"
          autofocus
          v-model="currentDish.name"
          :error-messages="currentDishErrors.name"
        />
        <v-divider class="mb-4"></v-divider>
        <v-textarea
          label="REZEPT"
          v-model="currentDish.description"
          :error-messages="currentDishErrors.description"
        ></v-textarea>
        <v-divider class="mb-4"></v-divider>
        <v-table class="bg-black">
          <tbody>
            <tr v-for="ingredient in currentDish.ingredients">
              <td class="pa-1">
                <v-text-field
                  hide-details
                  v-model="ingredient.name"
                  label="Zutat"
                />
              </td>
              <td class="pa-1">
                <v-text-field
                  hide-details
                  v-model="ingredient.amount"
                  label="Menge"
                />
              </td>
              <td class="pa-0" style="width: 0">
                <v-btn
                  class="px-0 py-2"
                  style="min-width: 0"
                  tabindex="-1"
                  color="error"
                  @click.stop="deleteIngredient(currentDish, ingredient)"
                >
                  <v-icon icon="mdi-close"></v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div class="d-flex justify-end mt-2">
          <v-btn color="success" type="submit"
            ><v-icon icon="mdi-check"></v-icon
          ></v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
  <div style="overflow: auto">
    <header style="height: 56px">
      <form
        class="bg-primary d-flex justify-space-between align-center h-100"
        @submit.prevent="saveUser"
      >
        <span v-if="!editingUser" class="ms-4 text-h6">{{
          user.toUpperCase()
        }}</span>
        <span v-else class="w-100">
          <v-text-field hide-details v-model="user"></v-text-field>
        </span>
        <v-btn
          :type="editingUser ? 'submit' : 'button'"
          @click="editingUser = !editingUser"
          color="primary"
          class="px-2 mx-3"
          style="min-width: 0"
        >
          <v-icon v-if="editingUser" icon="mdi-check"></v-icon>
          <v-icon v-else icon="mdi-pen"></v-icon>
        </v-btn>
      </form>
    </header>
    <main class="bg-black">
      <v-table class="bg-black" fixed-header :height="tableContentHeight">
        <thead>
          <tr class="bg-black">
            <td class="filter px-0" colspan="2">
              <v-select
                :items="searchableIngredients"
                v-model="searchedIngredients"
                multiple
                hide-details
                append-icon="mdi-close"
                @click:append="searchedIngredients = []"
                :placeholder="filteredDishes.length + ' Gerichte'"
              >
                <template v-slot:selection="{ index }">
                  <span class="text-grey" v-if="index == 0">
                    {{
                      filteredDishes.length == 1
                        ? "1 Gericht"
                        : filteredDishes.length + " Gerichte"
                    }}
                  </span>
                </template></v-select
              >
            </td>
            <td class="px-2 w-0">
              <v-btn color="primary" @click.stop="showCreateDish">
                <v-icon icon="mdi-plus"></v-icon>
              </v-btn>
            </td>
          </tr>
        </thead>
        <tbody>
          <template v-for="author of authors">
            <tr class="bg-primary">
              <td style="font-weight: bold; font-size: 1.2em" colspan="3">
                {{ author
                }}{{ author[author.length - 1] == "s" ? "'" : "'s" }} Gerichte
                ({{ filteredDishes.filter((d) => d.author == author).length }})
              </td>
            </tr>
            <template
              v-for="dish in filteredDishes.filter((d) => d.author == author)"
            >
              <tr>
                <td>{{ dish.name }}</td>
                <td class="pa-0 w-0">
                  <v-btn color="error" @click.stop="deleteDish(dish)">
                    <v-icon icon="mdi-delete"></v-icon>
                  </v-btn>
                </td>
                <td class="px-2">
                  <v-btn color="secondary" @click.stop="showEditDish(dish)">
                    <v-icon icon="mdi-pen"></v-icon
                  ></v-btn>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </v-table>
    </main>
  </div>
</template>
