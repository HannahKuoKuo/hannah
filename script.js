document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href").slice(1);
  if (!id) return;
  link.addEventListener("click", (event) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

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

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector(".carousel__btn--prev");
  const nextBtn = carousel.querySelector(".carousel__btn--next");
  const dotsWrap = carousel.querySelector(".carousel__dots");

  if (slides.length <= 1) {
    carousel.classList.add("carousel--single");
    return;
  }

  let index = 0;

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.setAttribute("aria-label", `第 ${i + 1} 張圖片`);
      dot.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        goTo(i);
      });
      dotsWrap.appendChild(dot);
    });
  }

  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, di) => dot.classList.toggle("is-active", di === index));
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      goTo(index - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      goTo(index + 1);
    });
  }

  goTo(0);

  const autoMs = Number(carousel.dataset.auto) || 0;
  if (autoMs > 0) {
    setInterval(() => goTo(index + 1), autoMs);
  }
});

const contactModal = document.getElementById("contactModal");

if (contactModal) {
  const openContactModal = () => {
    contactModal.classList.add("is-open");
    contactModal.setAttribute("aria-hidden", "false");
  };

  const closeContactModal = () => {
    contactModal.classList.remove("is-open");
    contactModal.setAttribute("aria-hidden", "true");
  };

  document.querySelectorAll(".js-contact-open").forEach((btn) => {
    btn.addEventListener("click", openContactModal);
  });

  contactModal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeContactModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeContactModal();
  });
}

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
