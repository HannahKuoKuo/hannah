document.getElementById("year").textContent = new Date().getFullYear();

const leadForm = document.getElementById("leadForm");
const formNote = document.getElementById("formNote");

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // TODO: 換成實際送出邏輯，例如打到後端 API 或第三方表單服務（如 Formspree、Google Sheet）
  // 送出成功後，如果有安裝 GA4 / Meta Pixel，建議在這裡觸發轉換事件，例如：
  // gtag('event', 'generate_lead');
  // fbq('track', 'Lead');

  formNote.textContent = "感謝您的諮詢，專人將盡快與您聯繫並提供建案資料！";
  leadForm.reset();
});
