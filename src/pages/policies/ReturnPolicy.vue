<script setup lang="ts">
import { ref } from 'vue'
import { APP_NAME } from '@/lib/appConfig'
import { useShippingConfigStore } from '@/stores/useShippingConfigStore'

const shippingStore = useShippingConfigStore()

// State for active FAQ/accordion
const activeAccordion = ref<number | null>(0)

const toggleAccordion = (index: number) => {
    activeAccordion.value = activeAccordion.value === index ? null : index
}

const policySteps = [
    {
        icon: 'chat',
        title: 'Bước 1: Liên hệ hỗ trợ',
        desc: 'Nhắn tin trực tiếp qua nút Chăm sóc khách hàng ở góc màn hình hoặc gọi tới số hotline hỗ trợ để yêu cầu đổi/trả sản phẩm.'
    },
    {
        icon: 'camera_alt',
        title: 'Bước 2: Gửi thông tin kiểm tra',
        desc: 'Cung cấp mã đơn hàng ORD-... kèm hình ảnh chụp chi tiết tình trạng sản phẩm hiện tại để nhân viên xác nhận điều kiện đổi trả.'
    },
    {
        icon: 'local_shipping',
        title: 'Bước 3: Đóng gói & Gửi hàng',
        desc: 'Đóng gói sản phẩm cẩn thận (giữ nguyên hộp, tag mác và quà tặng kèm nếu có). Gửi hàng về kho của chúng tôi theo hướng dẫn từ nhân viên.'
    },
    {
        icon: 'currency_exchange',
        title: 'Bước 4: Nhận hàng mới hoặc Hoàn tiền',
        desc: 'Sau khi nhận và kiểm định hàng trả lại đạt yêu cầu, chúng tôi sẽ gửi sản phẩm đổi hoặc hoàn lại tiền (vào tài khoản ngân hàng) trong vòng 3-5 ngày làm việc.'
    }
]

const faqs = [
    {
        q: 'Tôi muốn đổi size thì có mất phí vận chuyển không?',
        a: 'Nếu bạn muốn đổi size hoặc đổi mẫu do thay đổi sở thích cá nhân, bạn vui lòng thanh toán phí vận chuyển 2 chiều. Nếu sản phẩm giao bị lỗi từ phía nhà sản xuất hoặc giao sai mẫu, chúng tôi sẽ hỗ trợ toàn bộ phí vận chuyển.'
    },
    {
        q: 'Các sản phẩm nào không được áp dụng chính sách đổi trả?',
        a: 'Chúng tôi không áp dụng đổi trả với các sản phẩm: Đã qua sử dụng, mất tag mác, sản phẩm thuộc chương trình giảm giá sâu (Sale từ 50% trở lên), hoặc các sản phẩm phụ kiện cá nhân (như tất, đồ lót).'
    },
    {
        q: 'Thời gian nhận lại tiền hoàn là bao lâu?',
        a: 'Thời gian hoàn tiền sẽ từ 3 đến 5 ngày làm việc kể từ khi kho hàng của chúng tôi tiếp nhận sản phẩm trả về và kiểm tra sản phẩm đáp ứng đầy đủ điều kiện đổi trả.'
    }
]
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24 font-display">
        <!-- Hero Section -->
        <section class="relative bg-zinc-900 text-white py-24 md:py-32 overflow-hidden">
            <div class="absolute inset-0 opacity-40">
                <img
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070"
                    alt="LuxuStore Policy"
                    class="w-full h-full object-cover"
                />
            </div>
            <div class="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
                <span class="text-[10px] uppercase tracking-[0.4em] text-white/60 mb-4 block">Quyền lợi khách hàng</span>
                <h1 class="text-4xl md:text-6xl font-serif italic mb-6 leading-tight">CHÍNH SÁCH ĐỔI TRẢ</h1>
                <p class="max-w-2xl mx-auto text-sm md:text-base font-light text-zinc-300 leading-relaxed">
                    Sự hài lòng của quý khách là ưu tiên hàng đầu tại {{ APP_NAME }}. Chúng tôi mang đến chính sách đổi trả linh hoạt và chu đáo nhằm bảo vệ tối đa quyền lợi mua sắm của bạn.
                </p>
            </div>
        </section>

        <!-- Main Content -->
        <section class="max-w-[1200px] mx-auto px-6 py-16">
            <!-- 2 Columns Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                <!-- Left: Rules & Conditions -->
                <div class="lg:col-span-7 space-y-10">
                    <div class="bg-white p-8 rounded-2xl border border-border-light shadow-sm space-y-6">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-[28px]">assignment_turned_in</span>
                            <h2 class="text-xl font-serif font-bold text-fashion-black">Điều kiện đổi & trả hàng</h2>
                        </div>
                        <hr class="border-border-light" />
                        <ul class="space-y-4">
                            <li class="flex items-start gap-3 text-sm font-light text-zinc-600 leading-relaxed">
                                <span class="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 mt-0.5">check_circle</span>
                                <span>Sản phẩm phải còn nguyên nhãn mác, hộp đựng (đối với giày dép/phụ kiện), chưa qua sử dụng, chưa giặt ủi và không bị ám mùi lạ (nước hoa, cơ thể, khói thuốc).</span>
                            </li>
                            <li class="flex items-start gap-3 text-sm font-light text-zinc-600 leading-relaxed">
                                <span class="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 mt-0.5">check_circle</span>
                                <span>Thời gian yêu cầu đổi hàng trong vòng **07 ngày** kể từ ngày khách hàng nhận sản phẩm thành công từ shipper hoặc mua trực tiếp tại cửa hàng.</span>
                            </li>
                            <li class="flex items-start gap-3 text-sm font-light text-zinc-600 leading-relaxed">
                                <span class="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 mt-0.5">check_circle</span>
                                <span>Trường hợp đổi trả do lỗi kỹ thuật (đường may, chất liệu vải lỗi, hỏng khuy khóa) hoặc gửi sai sản phẩm: Hỗ trợ thời hạn lên tới **30 ngày** miễn phí vận chuyển.</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Process Timeline -->
                    <div class="space-y-6">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-[28px]">published_with_changes</span>
                            <h2 class="text-xl font-serif font-bold text-fashion-black">Quy trình thực hiện đổi trả</h2>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                v-for="(step, idx) in policySteps" 
                                :key="idx"
                                class="bg-white p-6 rounded-xl border border-border-light/80 hover:border-primary/40 hover:shadow-md transition-all duration-300 space-y-3"
                            >
                                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span class="material-symbols-outlined text-[20px]">{{ step.icon }}</span>
                                </div>
                                <h3 class="text-sm font-bold text-fashion-black">{{ step.title }}</h3>
                                <p class="text-xs font-light text-zinc-500 leading-relaxed">{{ step.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: FAQ Accordions -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="bg-white p-8 rounded-2xl border border-border-light shadow-sm space-y-6">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-[28px]">help_center</span>
                            <h2 class="text-xl font-serif font-bold text-fashion-black">Câu hỏi thường gặp</h2>
                        </div>
                        <hr class="border-border-light" />
                        <div class="space-y-4">
                            <div 
                                v-for="(faq, index) in faqs" 
                                :key="index"
                                class="border-b border-border-light/60 pb-4 last:border-none last:pb-0"
                            >
                                <button
                                    class="w-full flex justify-between items-center text-left py-2 focus:outline-none group"
                                    @click="toggleAccordion(index)"
                                >
                                    <span class="text-sm font-semibold text-zinc-700 group-hover:text-primary transition-colors pr-4">
                                        {{ faq.q }}
                                    </span>
                                    <span class="material-symbols-outlined text-zinc-400 shrink-0 select-none transition-transform duration-300" :class="{ 'rotate-180': activeAccordion === index }">
                                        expand_more
                                    </span>
                                </button>
                                <div 
                                    v-show="activeAccordion === index"
                                    class="mt-2 text-xs font-light text-zinc-500 leading-relaxed transition-all"
                                >
                                    {{ faq.a }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Box -->
                    <div class="bg-fashion-black text-white p-8 rounded-2xl space-y-6">
                        <h3 class="text-lg font-serif italic font-medium">Bạn cần thêm sự hỗ trợ trực tiếp?</h3>
                        <p class="text-xs font-light text-zinc-400 leading-relaxed">
                            Đội ngũ Chăm sóc Khách hàng luôn sẵn sàng trả lời các thắc mắc của bạn từ 8:30 - 22:00 hàng ngày.
                        </p>
                        <div class="space-y-3 pt-2">
                            <a 
                                :href="`tel:${shippingStore.config.phone_support}`"
                                class="flex items-center gap-3 text-xs hover:text-primary transition-colors"
                            >
                                <span class="material-symbols-outlined text-primary text-[18px]">phone</span>
                                <span>Hotline: {{ shippingStore.config.phone_support }}</span>
                            </a>
                            <div class="flex items-center gap-3 text-xs text-zinc-400">
                                <span class="material-symbols-outlined text-primary text-[18px]">mail</span>
                                <span>Email: cskh@{{ APP_NAME.toLowerCase() }}.vn</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    </div>
</template>

<style scoped>
@reference "../../assets/main.css";
</style>
