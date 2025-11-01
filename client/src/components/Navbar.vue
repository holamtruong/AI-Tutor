<template>
  <!-- Thanh navbar chinh hien logo va dieu huong -->
  <header class="navbar">
    <div class="navbar__layout navbar__layout--row">
      <router-link class="navbar__brand" to="/dashboard">AI Tutor</router-link>
      <!-- Khu link chinh dan toi cac trang bai tap viet tu dien chat -->
      <nav class="navbar__links">
        <router-link to="/chat">Trò chuyện</router-link>
        <router-link to="/dictionary">Từ điển</router-link>
        <router-link to="/assignment">Bài tập</router-link>
        <router-link to="/writing">Luyện viết</router-link>
    
   
      </nav>
      <!-- Khu menu thong tin ca nhan va nut dang xuat -->
      <div class="navbar__user" ref="menuRef">
        <button
          class="navbar__user-button"
          type="button"
          @click="toggleMenu"
          :aria-expanded="isMenuOpen.toString()"
          :aria-controls="menuPanelId"
        >
          <span class="navbar__user-name">{{ displayName }}</span>
          <svg
            class="navbar__user-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3.2 5.5a.75.75 0 0 1 1.06-.1L8 8.5l3.74-3.1a.75.75 0 0 1 .94 1.17l-4.25 3.5a.75.75 0 0 1-.94 0l-4.25-3.5a.75.75 0 0 1-.1-1.06Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div
          v-if="isMenuOpen"
          class="navbar__menu"
          role="dialog"
          aria-modal="false"
          :id="menuPanelId"
        >
          <div class="navbar__menu-summary">
            <div class="navbar__menu-summary-item">
              <span class="navbar__menu-summary-label">Tuổi</span>
              <span class="navbar__menu-summary-value">{{ ageDisplay }}</span>
            </div>
            <div class="navbar__menu-summary-item">
              <span class="navbar__menu-summary-label">Cấp độ</span>
              <span class="navbar__menu-summary-value">{{ levelDisplay }}</span>
            </div>
          </div>
          <form class="navbar__menu-section" @submit.prevent="handleSaveProfile">
            <label class="navbar__menu-label" :for="nameInputId">
              Tên hiển thị
            </label>
            <input
              :id="nameInputId"
              ref="nameFieldRef"
              v-model="nameInput"
              class="navbar__menu-input"
              type="text"
              placeholder="Nhập tên của bạn"
              autocomplete="name"
            />
            <p v-if="formErrors.name" class="navbar__menu-error">{{ formErrors.name }}</p>
            <label class="navbar__menu-label" :for="ageInputId">
              Tuổi
            </label>
            <input
              :id="ageInputId"
              v-model="ageInput"
              class="navbar__menu-input"
              type="number"
              min="7"
              max="60"
              step="1"
              placeholder="Nhập tuổi"
              inputmode="numeric"
            />
            <p v-if="formErrors.age" class="navbar__menu-error">{{ formErrors.age }}</p>
            <label class="navbar__menu-label" :for="levelSelectId">
              Cấp độ
            </label>
            <select
              :id="levelSelectId"
              v-model="levelInput"
              class="navbar__menu-select"
            >
              <option value="">Chọn cấp độ</option>
              <option
                v-for="level in levelOptions"
                :key="level.id"
                :value="level.id"
              >
                {{ level.name }}
              </option>
            </select>
            <p v-if="formErrors.level" class="navbar__menu-error">{{ formErrors.level }}</p>
            <div class="navbar__menu-actions">
              <button type="submit" class="navbar__menu-save">Lưu</button>
            </div>
          </form>
          <button type="button" class="navbar__menu-logout" @click="handleLogout">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </header>

</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import {
  clearUserPreferences,
  getUserPreferences,
  saveUserPreferences,
} from "@/utils/localStorage";
import { PROFICIENCY_LEVELS } from "@/constants";

const router = useRouter();
const prefs = reactive(getUserPreferences());
// Ten hien thi tren nut navbar de thay the khi chua co ten
const displayName = computed(() => {
  const name = prefs.fullName?.trim();
  return name && name.length > 0 ? name : "bạn";
});

const menuPanelId = "navbar-user-menu";
const nameInputId = "navbar-user-name";
const ageInputId = "navbar-user-age";
const levelSelectId = "navbar-user-level";
const isMenuOpen = ref(false);
const nameInput = ref(prefs.fullName ?? "");
const ageInput = ref(
  typeof prefs.age === "number" && !Number.isNaN(prefs.age) ? String(prefs.age) : ""
);
const levelInput = ref(
  typeof prefs.proficiencyLevel === "number" && !Number.isNaN(prefs.proficiencyLevel)
    ? String(prefs.proficiencyLevel)
    : ""
);
const formErrors = reactive({
  name: "",
  age: "",
  level: "",
});
const menuRef = ref<HTMLElement | null>(null);
const nameFieldRef = ref<HTMLInputElement | null>(null);
const levelOptions = PROFICIENCY_LEVELS;

// Ham nay goi mot lan la xoa het thong bao loi
const resetErrors = () => {
  formErrors.name = "";
  formErrors.age = "";
  formErrors.level = "";
};

// Noi dung tom tat giu cho cac gia tri trong menu doc de chiu
const ageDisplay = computed(() => {
  if (typeof prefs.age !== "number" || Number.isNaN(prefs.age)) {
    return "Chưa cập nhật";
  }
  return `${prefs.age}`;
});

// Tim ten cap do de doc nhung van co so luu tru neu khong tim thay
const levelDisplay = computed(() => {
  if (
    typeof prefs.proficiencyLevel !== "number" ||
    Number.isNaN(prefs.proficiencyLevel)
  ) {
    return "Chưa cập nhật";
  }
  const match = levelOptions.find((entry) => entry.id === prefs.proficiencyLevel);
  return match ? match.name : `Cấp độ ${prefs.proficiencyLevel}`;
});

// Tach ham dong mo rieng de callback ben duoi de doc
const closeMenu = () => {
  isMenuOpen.value = false;
};

const openMenu = () => {
  isMenuOpen.value = true;
};

// Nut mo menu se goi ham nay de dong khi dang mo
const toggleMenu = () => {
  if (isMenuOpen.value) {
    closeMenu();
    return;
  }
  openMenu();
};

// Dong bo thong tin moi nhat tu localStorage moi khi can
const syncPreferences = () => {
  const latest = getUserPreferences();
  Object.keys(prefs).forEach((key) => {
    if (!(key in latest)) {
      delete (prefs as Record<string, unknown>)[key];
    }
  });
  Object.assign(prefs, latest);
  if (isMenuOpen.value) {
    nameInput.value = prefs.fullName ?? "";
    ageInput.value =
      typeof prefs.age === "number" && !Number.isNaN(prefs.age) ? String(prefs.age) : "";
    levelInput.value =
      typeof prefs.proficiencyLevel === "number" && !Number.isNaN(prefs.proficiencyLevel)
        ? String(prefs.proficiencyLevel)
        : "";
    resetErrors();
  }
};

// Neu bam ben ngoai se gap menu lai
const handleDocumentClick = (event: MouseEvent) => {
  if (!isMenuOpen.value) {
    return;
  }
  const target = event.target as Node | null;
  if (target && menuRef.value?.contains(target)) {
    return;
  }
  closeMenu();
};

// Nhan esc la tat menu cho ban dung ban phim
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeMenu();
  }
};

// Lang nghe thay doi tu tab khac de thong tin khong lech
const handleStorage = (event: StorageEvent) => {
  if (event.key !== null && event.key !== "user-preferences") {
    return;
  }
  syncPreferences();
};

// Kiem tra va luu ho so moi dong thoi hien loi neu co van de
const handleSaveProfile = () => {
  resetErrors();

  const trimmedName = nameInput.value.trim();
  if (!trimmedName) {
    formErrors.name = "Vui lòng nhập tên hiển thị.";
  }

  const trimmedAge = ageInput.value.trim();
  let ageNumber: number | undefined;
  if (!trimmedAge) {
    formErrors.age = "Vui lòng nhập tuổi.";
  } else {
    const parsedAge = Number.parseInt(trimmedAge, 10);
    if (Number.isNaN(parsedAge)) {
      formErrors.age = "Tuổi không hợp lệ.";
    } else if (parsedAge < 7 || parsedAge > 60) {
      formErrors.age = "Tuổi phải trong khoảng 7 - 60.";
    } else {
      ageNumber = parsedAge;
    }
  }

  const trimmedLevel = levelInput.value.trim();
  let levelNumber: number | undefined;
  if (!trimmedLevel) {
    formErrors.level = "Vui lòng chọn cấp độ.";
  } else {
    const parsedLevel = Number.parseInt(trimmedLevel, 10);
    const exists = levelOptions.some((entry) => entry.id === parsedLevel);
    if (Number.isNaN(parsedLevel) || !exists) {
      formErrors.level = "Cấp độ không hợp lệ.";
    } else {
      levelNumber = parsedLevel;
    }
  }

  if (formErrors.name || formErrors.age || formErrors.level) {
    return;
  }

  const updated = saveUserPreferences({
    fullName: trimmedName,
    age: ageNumber,
    proficiencyLevel: levelNumber,
  });
  Object.assign(prefs, updated);
  closeMenu();
};

// Xoa thiet lap dua form ve trang thai ban dau va dua ve onboarding
const handleLogout = () => {
  clearUserPreferences();
  syncPreferences();
  nameInput.value = "";
  ageInput.value = "";
  levelInput.value = "";
  resetErrors();
  closeMenu();
  router.push("/");
};

// Moi lan menu mo se nap lai du lieu va dat con tro vao o nhap
watch(isMenuOpen, (open) => {
  if (open) {
    nameInput.value = prefs.fullName ?? "";
    ageInput.value =
      typeof prefs.age === "number" && !Number.isNaN(prefs.age) ? String(prefs.age) : "";
    levelInput.value =
      typeof prefs.proficiencyLevel === "number" && !Number.isNaN(prefs.proficiencyLevel)
        ? String(prefs.proficiencyLevel)
        : "";
    resetErrors();
    nextTick(() => {
      nameFieldRef.value?.focus();
      nameFieldRef.value?.select();
    });
  }
});

// Dang ky cac su kien de quan ly con tro va dong bo giua nhieu tab
onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("storage", handleStorage);
});

// Huy dang ky su kien de tranh ro ri khi thanh navbar bi go
onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("storage", handleStorage);
});
</script>

<style scoped>
/* Khu dieu khien tai khoan tren thanh navbar */
.navbar__user {
  position: relative;
  display: flex;
  align-items: center;
}

.navbar__user-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  color: inherit;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.navbar__user-button:hover {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
  transform: translateY(-1px);
}

.navbar__user-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 3px;
}

.navbar__user-name {
  max-width: 12rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar__user-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.navbar__menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 260px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: navbar-menu-fade 0.15s ease-out;
  z-index: 20;
}

.navbar__menu::before {
  content: "";
  position: absolute;
  top: -9px;
  right: 1.5rem;
  width: 18px;
  height: 18px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: -3px -3px 8px rgba(15, 23, 42, 0.05);
  z-index: -1;
}

.navbar__menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.navbar__menu-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(99, 102, 241, 0.08);
}

.navbar__menu-summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.navbar__menu-summary-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.navbar__menu-summary-value {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.95rem;
}

.navbar__menu-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #0f172a;
}

.navbar__menu-input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 0.55rem 0.65rem;
  font-size: 0.95rem;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.9);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.navbar__menu-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.75);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: #ffffff;
}

.navbar__menu-select {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 0.55rem 0.65rem;
  font-size: 0.95rem;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.9);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  appearance: none;
}

.navbar__menu-select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.75);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: #ffffff;
}

.navbar__menu-error {
  margin: 0;
  font-size: 0.78rem;
  color: #dc2626;
}

.navbar__menu-actions {
  display: flex;
  justify-content: flex-end;
}

.navbar__menu-save {
  border: none;
  border-radius: 12px;
  padding: 0.45rem 1rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  box-shadow: 0 12px 22px rgba(99, 102, 241, 0.32);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.navbar__menu-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 26px rgba(99, 102, 241, 0.38);
}

.navbar__menu-save:focus-visible {
  outline: 2px solid rgba(99, 102, 241, 0.85);
  outline-offset: 3px;
}

.navbar__menu-logout {
  border: none;
  border-radius: 12px;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
  transition: background 0.2s ease, transform 0.2s ease;
}

.navbar__menu-logout:hover {
  background: rgba(239, 68, 68, 0.18);
  transform: translateY(-1px);
}

.navbar__menu-logout:focus-visible {
  outline: 2px solid rgba(239, 68, 68, 0.55);
  outline-offset: 3px;
}

@keyframes navbar-menu-fade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* Nen gradient giup navbar noi bat tren trang */
.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  background: linear-gradient(90deg, #f8fafc 80%, #e0e7ef 100%);
  box-shadow: 0 4px 24px rgba(79, 70, 229, 0.08);
  color: #0f172a;
  background-size: 200% 200%;
  animation: navbar-gradient-move 12s ease-in-out infinite;
}

@keyframes navbar-gradient-move {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.navbar__layout {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
}

.navbar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: #2563eb;
  background: linear-gradient(90deg, #3b82f6 40%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  /* Giu gradient cho chu khong bi to mau mac dinh */
}

.navbar__links {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.navbar__brand {
  margin-right: 2.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.navbar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.navbar__links {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.navbar__links a {
  text-decoration: none;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  color: inherit;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.navbar__links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.65);
  transform: translateY(-1px);
}

.navbar__links a:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

@media (max-width: 720px) {
  .navbar {
    flex-direction: column;
    gap: 0.75rem;
  }

  .navbar__menu {
    width: min(90vw, 260px);
    right: 0;
  }

  .navbar__menu-summary {
    grid-template-columns: 1fr;
  }
}
</style>
