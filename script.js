
"use strict";

// ======================================
// 1. SIDEBAR TOGGLE
// ======================================

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

sidebarBtn?.addEventListener("click", () => {
  sidebar?.classList.toggle("active");
});


// ======================================
// 2. TESTIMONIAL MODAL
// ======================================

const modal = document.querySelector("[data-modal-container]");
const overlay = document.querySelector("[data-overlay]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");

const testimonialItems = document.querySelectorAll(
  "[data-testimonials-item]"
);

const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const toggleModal = () => {
  modal?.classList.toggle("active");
  overlay?.classList.toggle("active");
};

testimonialItems.forEach((item) => {
  item.addEventListener("click", () => {
    const avatar = item.querySelector("[data-testimonials-avatar]");
    const title = item.querySelector("[data-testimonials-title]");
    const text = item.querySelector("[data-testimonials-text]");

    if (modalImg && avatar) {
      modalImg.src = avatar.src;
      modalImg.alt = avatar.alt;
    }

    if (modalTitle && title) {
      modalTitle.textContent = title.textContent.trim();
    }

    if (modalText && text) {
      modalText.innerHTML = text.innerHTML;
    }

    toggleModal();
  });
});

modalCloseBtn?.addEventListener("click", toggleModal);
overlay?.addEventListener("click", toggleModal);


// ======================================
// 3. PROJECT FILTER
// ======================================

const filterButtons = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

const selectButton = document.querySelector("[data-select]");
const selectValue = document.querySelector("[data-select-value]");
const selectItems = document.querySelectorAll("[data-select-item]");

function filterProjects(category) {
  const selectedCategory = category.trim().toLowerCase();

  // Show or hide projects
  filterItems.forEach((project) => {
    const categories = (project.dataset.category || "")
      .split("|")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const shouldShow =
      selectedCategory === "all" ||
      categories.includes(selectedCategory);

    project.hidden = !shouldShow;
    project.classList.toggle("active", shouldShow);
  });

  // Update active desktop button
  filterButtons.forEach((button) => {
    const buttonCategory = button.textContent.trim().toLowerCase();

    button.classList.toggle(
      "active",
      buttonCategory === selectedCategory
    );
  });

  // Update mobile dropdown label
  if (selectValue) {
    selectValue.textContent = category.trim();
  }

  // Update active mobile option, if applicable
  selectItems.forEach((item) => {
    const option = item.matches("button")
      ? item
      : item.querySelector("button");

    const optionCategory = (
      option?.textContent || item.textContent
    ).trim().toLowerCase();

    option?.classList.toggle(
      "active",
      optionCategory === selectedCategory
    );
  });
}

// Desktop filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterProjects(button.textContent.trim());
  });
});

// Mobile dropdown open/close
selectButton?.addEventListener("click", () => {
  selectButton.classList.toggle("active");
});

// Mobile dropdown options
selectItems.forEach((item) => {
  item.addEventListener("click", () => {
    const option = item.matches("button")
      ? item
      : item.querySelector("button");

    const category = (
      option?.textContent || item.textContent
    ).trim();

    filterProjects(category);
    selectButton?.classList.remove("active");
  });
});

// Initial state
filterProjects("All");


// ======================================
// 4. PAGE NAVIGATION
// ======================================

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetPage = link.dataset.navLink;

    pages.forEach((page) => {
      page.classList.toggle(
        "active",
        page.dataset.page === targetPage
      );
    });

    navigationLinks.forEach((navLink) => {
      navLink.classList.toggle("active", navLink === link);
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});


// ======================================
// 5. CONTACT FORM
// ======================================

const contactForm = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formSubmitBtn = document.querySelector("[data-form-btn]");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const formData = new FormData(contactForm);

  const data = {
    name: formData.get("name")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    subject: "Portfolio Contact Form",
    message: formData.get("message")?.toString().trim(),
  };

  try {
    if (formSubmitBtn) {
      formSubmitBtn.disabled = true;
    }

    const response = await fetch(
      "http://localhost:3000/api/contact-form",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Failed to send message.");
    }

    alert(result.message || "Message sent successfully!");
    contactForm.reset();
  } catch (error) {
    console.error("Contact form error:", error);
    alert(
      "Unable to send your message. Please check your backend server and try again."
    );
  } finally {
    if (formSubmitBtn) {
      formSubmitBtn.disabled = false;
    }
  }
});
