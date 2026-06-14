<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { chatAIHandler } from "./chatAIHandler";
import { getImageUrl } from "@/lib/urlHelper";
import { productService } from "@/pages/products/productService";

const isOpen = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const router = useRouter();
const categories = ref<Array<{ category_id: number; slug: string }>>([]);
let categoriesRequest: Promise<void> | null = null;

const { inputText, isSending, error, messages, sendMessage, retryLastMessage } =
  chatAIHandler();

function toggleChat() {
  isOpen.value = !isOpen.value;
}

async function handleSendMessage() {
  await sendMessage(scrollToBottom);
}

async function handleRetryMessage() {
  await retryLastMessage(scrollToBottom);
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function normalizeImageUrl(url: string) {
  return url.replace(/[),.;]+$/, "");
}

function isLikelyImageUrl(url: string) {
  const value = url.toLowerCase();
  return (
    /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/.test(value) ||
    value.includes("/image/") ||
    value.includes("image") ||
    value.includes("img") ||
    value.includes("cloudinary") ||
    value.includes("googleusercontent") ||
    value.includes("firebasestorage")
  );
}

type MessageContentPart =
  | { type: "text"; content: string }
  | { type: "images"; urls: string[] };

type MessageDisplayPart =
  | MessageContentPart
  | { type: "product"; slug: string; children: MessageContentPart[] }
  | { type: "category"; target: string; children: MessageContentPart[] };

function getProductSlugFromLink(link: string) {
  const value = link.trim();
  const match = value.match(/(?:^|\/)products\/([^/?#]+)/);
  return decodeURIComponent(match?.[1] || value.replace(/^\/+|\/+$/g, ""));
}

function getCategoryTargetFromLink(link: string) {
  return decodeURIComponent(link.trim());
}

async function ensureCategoriesLoaded() {
  if (categories.value.length) return;
  if (categoriesRequest) return categoriesRequest;

  categoriesRequest = productService
    .getCategories()
    .then((response) => {
      categories.value = Array.isArray(response.data) ? response.data : [];
    })
    .catch(() => {
      categories.value = [];
    })
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
}

function parseContentParts(content: string): MessageContentPart[] {
  const parts: MessageContentPart[] = [];
  const textLines: string[] = [];
  const standaloneUrlPattern =
    /^\s*(?:[-*\u2022]\s*)?((?:https?:\/\/|\/)[^\s<>"']+)\s*$/;

  const flushText = () => {
    const text = textLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text) parts.push({ type: "text", content: text });
    textLines.length = 0;
  };

  for (const line of content.split("\n")) {
    const match = line.match(standaloneUrlPattern);
    if (match?.[1]) {
      const url = normalizeImageUrl(match[1]);
      if (isLikelyImageUrl(url)) {
        flushText();

        const previousPart = parts[parts.length - 1];
        if (previousPart?.type === "images") {
          if (!previousPart.urls.includes(url)) previousPart.urls.push(url);
        } else {
          parts.push({ type: "images", urls: [url] });
        }

        continue;
      }
    }

    textLines.push(line);
  }

  flushText();
  return parts;
}

function parseMessageContent(content: string): MessageDisplayPart[] {
  const parts: MessageDisplayPart[] = [];
  const textLines: string[] = [];
  let currentItem: {
    type: "product" | "category" | null;
    slug: string;
    target: string;
    lines: string[];
  } | null = null;

  const productLinkPattern = /^\s*<!--\s*product-link:([^>]+?)\s*-->\s*$/;
  const categoryLinkPattern = /^\s*<!--\s*category-link:([^>]+?)\s*-->\s*$/;
  const productTitlePattern = /^\s*\d+\.\s+\S/;
  const separatorPattern = /^\s*[\u2500-]{5,}\s*$/;

  const pushTextParts = (lines: string[]) => {
    parts.push(...parseContentParts(lines.join("\n")));
    lines.length = 0;
  };

  const flushItem = () => {
    if (!currentItem) return;

    const children = parseContentParts(currentItem.lines.join("\n"));
    if (children.length) {
      if (currentItem.type === "product" && currentItem.slug) {
        parts.push({
          type: "product",
          slug: currentItem.slug,
          children,
        });
      } else if (currentItem.type === "category" && currentItem.target) {
        parts.push({
          type: "category",
          target: currentItem.target,
          children,
        });
      } else {
        parts.push(...children);
      }
    }

    currentItem = null;
  };

  for (const line of content.split("\n")) {
    if (productTitlePattern.test(line)) {
      flushItem();
      pushTextParts(textLines);
      currentItem = {
        type: null,
        slug: "",
        target: "",
        lines: [line],
      };
      continue;
    }

    const productLinkMatch = line.match(productLinkPattern);
    if (productLinkMatch?.[1]) {
      if (currentItem) {
        currentItem.type = "product";
        currentItem.slug = getProductSlugFromLink(productLinkMatch[1]);
      }
      continue;
    }

    const categoryLinkMatch = line.match(categoryLinkPattern);
    if (categoryLinkMatch?.[1]) {
      if (currentItem) {
        currentItem.type = "category";
        currentItem.target = getCategoryTargetFromLink(categoryLinkMatch[1]);
      }
      continue;
    }

    if (currentItem) {
      if (separatorPattern.test(line)) {
        flushItem();
      } else {
        currentItem.lines.push(line);
      }
      continue;
    }

    textLines.push(line);
  }

  flushItem();
  pushTextParts(textLines);

  return parts;
}

function openProduct(slug: string) {
  if (slug) void router.push({ name: "product-detail", params: { slug } });
}

async function openCategory(target: string) {
  if (!target) return;

  if (target.startsWith("/products")) {
    await router.push(target);
    return;
  }

  await ensureCategoriesLoaded();
  const category = categories.value.find((item) => item.slug === target);
  if (category) {
    await router.push(`/products?category_id=${category.category_id}`);
  }
}
</script>

<template>
  <div
    class="fixed bottom-[88px] right-6 z-[150] flex flex-col items-end gap-3"
  >
    <!-- Chat Window -->
    <Transition name="chat-window">
      <div
        v-if="isOpen"
        class="w-[360px] bg-white border border-border-light shadow-2xl flex flex-col overflow-hidden"
        style="height: 480px"
      >
        <!-- Header -->
        <div
          class="bg-fashion-black text-white px-5 py-4 flex items-center justify-between shrink-0"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
            >
              <span
                class="material-symbols-outlined text-white text-[18px]"
                style="font-variation-settings: &quot;FILL&quot; 1"
                >smart_toy</span
              >
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-widest">
                Luxu AI
              </p>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"
                ></span>
                <span class="text-[9px] text-zinc-400 uppercase tracking-widest"
                  >Online</span
                >
              </div>
            </div>
          </div>
          <button
            @click="toggleChat"
            class="text-zinc-400 hover:text-white transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="flex-grow overflow-y-auto p-4 space-y-4 bg-background-light"
        >
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex gap-2',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
            ]"
          >
            <!-- Avatar -->
            <div
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                message.role === 'assistant'
                  ? 'bg-primary'
                  : 'bg-fashion-black',
              ]"
            >
              <span
                class="material-symbols-outlined text-white text-[14px]"
                style="font-variation-settings: &quot;FILL&quot; 1"
              >
                {{ message.role === "assistant" ? "smart_toy" : "person" }}
              </span>
            </div>

            <!-- Bubble -->
            <div
              :class="[
                'max-w-[75%]',
                message.role === 'user' ? 'items-end' : 'items-start',
                'flex flex-col gap-1',
              ]"
            >
              <div
                :class="[
                  'px-4 py-3 text-[12px] leading-relaxed flex flex-col gap-2',
                  message.role === 'assistant'
                    ? 'bg-white border border-border-light text-fashion-black'
                    : 'bg-fashion-black text-white',
                ]"
              >
                <template
                  v-for="(part, partIndex) in parseMessageContent(
                    message.content,
                  )"
                  :key="`${message.id}-${partIndex}`"
                >
                  <p v-if="part.type === 'text'" class="whitespace-pre-wrap">
                    {{ part.content }}
                  </p>
                  <div
                    v-else-if="part.type === 'images' && part.urls.length"
                    class="grid grid-cols-2 gap-2"
                  >
                    <a
                      v-for="imageUrl in part.urls"
                      :key="imageUrl"
                      :href="getImageUrl(imageUrl)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block overflow-hidden border border-border-light bg-zinc-50"
                    >
                      <img
                        :src="getImageUrl(imageUrl)"
                        alt="Ảnh sản phẩm"
                        class="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                        @load="scrollToBottom"
                      />
                    </a>
                  </div>
                  <button
                    v-else-if="part.type === 'product'"
                    type="button"
                    class="block w-full text-left border border-border-light bg-zinc-50 px-3 py-3 transition-colors hover:border-primary hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    @click="openProduct(part.slug)"
                  >
                    <template
                      v-for="(child, childIndex) in part.children"
                      :key="`${message.id}-${partIndex}-${childIndex}`"
                    >
                      <p
                        v-if="child.type === 'text'"
                        class="whitespace-pre-wrap"
                      >
                        {{ child.content }}
                      </p>
                      <div
                        v-else-if="child.urls.length"
                        class="mt-2 grid grid-cols-1 gap-2"
                      >
                        <img
                          v-for="imageUrl in child.urls.slice(0, 1)"
                          :key="imageUrl"
                          :src="getImageUrl(imageUrl)"
                          alt="Ảnh sản phẩm"
                          class="aspect-[3/4] w-full border border-border-light bg-white object-cover"
                          loading="lazy"
                          @load="scrollToBottom"
                        />
                      </div>
                    </template>
                  </button>
                  <button
                    v-else-if="part.type === 'category'"
                    type="button"
                    class="block w-full text-left border border-border-light bg-zinc-50 px-3 py-2 transition-colors hover:border-primary hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    @click="openCategory(part.target)"
                  >
                    <template
                      v-for="(child, childIndex) in part.children"
                      :key="`${message.id}-${partIndex}-${childIndex}`"
                    >
                      <p
                        v-if="child.type === 'text'"
                        class="whitespace-pre-wrap"
                      >
                        {{ child.content }}
                      </p>
                    </template>
                  </button>
                </template>
              </div>
              <span class="text-[9px] text-zinc-400 px-1">{{
                message.time
              }}</span>
            </div>
          </div>

          <div v-if="isSending" class="flex gap-2">
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 bg-primary"
            >
              <span
                class="material-symbols-outlined text-white text-[14px] ai-thinking-icon"
                style="font-variation-settings: &quot;FILL&quot; 1"
                >progress_activity</span
              >
            </div>
            <div class="max-w-[75%] flex flex-col gap-1 items-start">
              <div
                class="px-4 py-3 text-[12px] leading-relaxed bg-white border border-border-light text-text-muted flex items-center gap-2"
              >
                <span class="inline-flex gap-1">
                  <span class="thinking-dot"></span>
                  <span class="thinking-dot"></span>
                  <span class="thinking-dot"></span>
                </span>
                <span>...</span>
              </div>
            </div>
          </div>

          <div v-if="error" class="flex justify-start">
            <button
              type="button"
              class="ml-9 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50"
              :disabled="isSending"
              @click="handleRetryMessage"
            >
              Gửi lại tin nhắn cuối
            </button>
          </div>
        </div>

        <!-- Input -->
        <div
          class="border-t border-border-light p-3 flex gap-2 shrink-0 bg-white"
        >
          <input
            v-model="inputText"
            @keyup.enter="handleSendMessage"
            type="text"
            placeholder="Nhập tin nhắn..."
            :disabled="isSending"
            class="flex-grow border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-fashion-black placeholder:text-zinc-400"
          />
          <button
            @click="handleSendMessage"
            :disabled="!inputText.trim() || isSending"
            class="w-10 h-10 bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span
              v-if="isSending"
              class="material-symbols-outlined text-[18px] ai-thinking-icon"
              >progress_activity</span
            >
            <span v-else class="material-symbols-outlined text-[18px]"
              >send</span
            >
          </button>
        </div>
      </div>
    </Transition>

    <!-- Toggle Button -->
    <button
      @click="toggleChat"
      class="w-14 h-14 bg-white border border-zinc-200 text-fashion-black rounded-full flex items-center justify-center shadow-xl hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
      :title="isOpen ? 'Đóng chat' : 'Chat với AI'"
    >
      <Transition name="icon-swap" mode="out-in">
        <span
          v-if="isOpen"
          key="close"
          class="material-symbols-outlined text-[24px]"
          >close</span
        >
        <span
          v-else
          key="open"
          class="material-symbols-outlined text-[24px]"
          style="font-variation-settings: &quot;FILL&quot; 1"
          >smart_toy</span
        >
      </Transition>
    </button>
  </div>
</template>

<style scoped>
.chat-window-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-window-leave-active {
  transition: all 0.2s ease;
}
.chat-window-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: all 0.15s ease;
}
.icon-swap-enter-from,
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.7) rotate(90deg);
}

.ai-thinking-icon {
  animation: ai-spin 0.9s linear infinite;
}

.thinking-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #17b0cf;
  animation: ai-pulse 1s ease-in-out infinite;
}

.thinking-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.thinking-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ai-pulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}
</style>
