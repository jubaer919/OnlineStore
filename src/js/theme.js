import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Money formatter
function formatMoney(cents, currency = "USD") {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency,
  });
}

Swiper.use([Navigation, Pagination]);

document.addEventListener("DOMContentLoaded", () => {
  // -------------------
  // Swiper setup
  // -------------------
  const swiper = new Swiper(".main-carousel", {
    loop: false,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    on: {
      slideChange: () => {
        updateActiveThumbnail();
      },
    },
  });

  // ------------------
  // Mini thumbnail and main carousel
  // ------------------
  const default_color = Object.keys(window.defaultImages)[0];
  const leftThumbnailContainer = document.getElementById("left-thumbnails");
  const mainCarouselWrapper = document.querySelector(".swiper-wrapper");
  let currentColor = default_color;

  // Setup thumbnail hover events
  function setupThumbnailInteractions() {
    const thumbnails =
      leftThumbnailContainer.querySelectorAll(".mini-thumbnail");
    thumbnails.forEach((thumb) => {
      // Remove any existing listeners to prevent duplicates
      thumb.removeEventListener("mouseover", handleThumbnailHover);
      thumb.removeEventListener("click", handleThumbnailClick);

      // Add fresh listeners
      thumb.addEventListener("mouseover", handleThumbnailHover);
      thumb.addEventListener("click", handleThumbnailClick);
    });
  }

  function handleThumbnailHover() {
    const index = parseInt(this.dataset.swiperSlideIndex, 10);
    swiper.slideTo(index);
  }

  function handleThumbnailClick() {
    const index = parseInt(this.dataset.swiperSlideIndex, 10);
    swiper.slideTo(index);
  }

  function renderThumbnails(color) {
    currentColor = color;

    // Clear existing content
    leftThumbnailContainer.innerHTML = "";
    mainCarouselWrapper.innerHTML = "";
    const images = window.defaultImages[color];

    // Create new content
    images.forEach((src, idx) => {
      // Create thumbnail
      const thumbDiv = document.createElement("div");
      thumbDiv.className =
        "mini-thumbnail w-14 h-14 border border-gray-400 cursor-pointer";
      thumbDiv.dataset.swiperSlideIndex = idx;
      thumbDiv.innerHTML = `
        <img src="${src}" alt="${color} thumbnail" class="object-cover w-full h-full">
      `;
      leftThumbnailContainer.appendChild(thumbDiv);

      // Create carousel slide
      const slideDiv = document.createElement("div");
      slideDiv.className = "swiper-slide h-full";
      slideDiv.innerHTML = `
        <img src="${src}" alt="${color} product image" class="object-cover w-full h-full">
      `;
      mainCarouselWrapper.appendChild(slideDiv);
    });

    // Update swiper and setup interactions
    swiper.update();
    swiper.slideTo(0);
    setupThumbnailInteractions();
    updateActiveThumbnail(0);
  }

  function updateActiveThumbnail(index = swiper.realIndex) {
    const thumbnails =
      leftThumbnailContainer.querySelectorAll(".mini-thumbnail");
    thumbnails.forEach((thumb, i) => {
      const isActive = i === index;
      thumb.classList.toggle("border-black", isActive);
      thumb.classList.toggle("opacity-100", isActive);
      thumb.classList.toggle("border-gray-400", !isActive);
      thumb.classList.toggle("opacity-30", !isActive);
    });
  }

  // Initialize with default color
  renderThumbnails(default_color);

  // -------------------
  // Product selection
  // -------------------
  let selectedSize = null;
  let selectedColor = null;
  let variantId = null;

  const sizeButtons = document.querySelectorAll(".size-button");
  const colorThumbnails = document.querySelectorAll(".color-thumbnail");
  const addToCartBtn = document.getElementById("add-to-cart-button");
  const warningEl = document.querySelector(".warning");

  // Update Add to Cart button
  function updateAddToCartState() {
    const isReady = selectedColor && selectedSize;
    addToCartBtn.disabled = !isReady;
    addToCartBtn.classList.toggle("opacity-50", !isReady);
    addToCartBtn.classList.toggle("cursor-not-allowed", !isReady);
    addToCartBtn.classList.toggle("cursor-pointer", isReady);
    addToCartBtn.title = isReady ? "" : "Please select color and size first";

    // Update variantId
    variantId =
      selectedColor && selectedSize
        ? window.variantInventory[selectedColor]?.[selectedSize]?.id || null
        : null;
  }

  // Size selection
  sizeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      // Clear previous selection
      sizeButtons.forEach((b) =>
        b.classList.remove(
          "bg-gray-300",
          "outline",
          "outline-1",
          "outline-black"
        )
      );
      sizeButtons.forEach((b) => b.classList.add("border-gray-200"));

      // Mark selected
      btn.classList.remove("border-gray-200");
      btn.classList.add("bg-gray-300", "outline", "outline-1", "outline-black");

      selectedSize = btn.dataset.size;
      updateAddToCartState();
    });
  });

  // Color selection
  colorThumbnails.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const color = thumb.dataset.color || "";
      selectedColor = color;

      // Update UI
      colorThumbnails.forEach((t) => (t.style.border = "1px solid gray"));
      thumb.style.border = "3px solid black";

      // Update inventory warning
      const inventory = parseInt(thumb.dataset.inventory, 10) || 0;
      warningEl.classList.toggle(
        "text-red-500",
        inventory > 0 && inventory < 20
      );
      warningEl.classList.toggle(
        "text-transparent",
        !(inventory > 0 && inventory < 20)
      );

      // Update sizes and render thumbnails
      updateSizeButtons(selectedColor);
      renderThumbnails(selectedColor);
      updateAddToCartState();
    });
  });

  // Enable/disable size buttons based on inventory
  function updateSizeButtons(color) {
    sizeButtons.forEach((btn) => {
      const size = btn.dataset.size;
      const qty = parseInt(
        window.variantInventory[color]?.[size]?.qty || 0,
        10
      );

      if (qty <= 0) {
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed", "line-through");
        btn.classList.remove(
          "bg-gray-300",
          "outline",
          "outline-1",
          "outline-black"
        );
      } else {
        btn.disabled = false;
        btn.classList.remove(
          "opacity-50",
          "cursor-not-allowed",
          "line-through"
        );
      }
    });

    // Clear selectedSize if it's no longer available
    if (
      selectedSize &&
      window.variantInventory[color]?.[selectedSize]?.qty <= 0
    ) {
      selectedSize = null;
    }
  }

  // Add to Cart
  addToCartBtn.addEventListener("click", async () => {
    if (!variantId) {
      console.warn("⚠️ variantId is NULL — cannot add to cart");
      return;
    }

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
        }),
      });

      const cartData = await res.json();
      const addedItem = cartData.items[0];
      console.log("🛒 Add to cart response:", addedItem);

      // Update modal content
      document.getElementById("modal-product-image").src = addedItem.image;
      document.getElementById("modal-product-title").textContent =
        addedItem.product_title;
      document.getElementById(
        "modal-product-size"
      ).textContent = `Size: UK ${addedItem.variant_options[1]}`;
      document.getElementById("modal-product-price").textContent = formatMoney(
        addedItem.price
      );

      const collectionEl = document.querySelector("[data-collection-name]");
      const collectionName = collectionEl
        ? collectionEl.dataset.collectionName
        : "";
      document.getElementById("modal-product-collection").textContent =
        collectionName;

      // Show modal
      document.getElementById("added-to-cart-modal").classList.remove("hidden");
      document.getElementById("cart-overlay").classList.remove("hidden");

      // Auto-close after 5 seconds
      clearTimeout(window.cartModalTimeout);
      window.cartModalTimeout = setTimeout(closeCartModal, 5000);
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  });

  function closeCartModal() {
    document.getElementById("added-to-cart-modal").classList.add("hidden");
    document.getElementById("cart-overlay").classList.add("hidden");
  }

  document
    .getElementById("cart-overlay")
    .addEventListener("click", closeCartModal);
  document
    .getElementById("close-modal")
    .addEventListener("click", closeCartModal);

  // Wishlist functionality
  document.getElementById("wishlist-button").addEventListener("click", (el) => {
    const button = el.currentTarget;
    const product = {
      id: button.dataset.productId,
      title: button.dataset.productTitle,
      price: button.dataset.productPrice,
      handle: button.dataset.productHandle,
      image: button.dataset.productImage,
    };

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    if (!wishlist.find((item) => item.id === product.id)) {
      wishlist.push(product);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }

    // Update wishlist modal
    document.getElementById("modal-wishlist-product-image").src = product.image;
    document.getElementById("modal-wishlist-product-title").textContent =
      product.title;
    document.getElementById("modal-wishlist-product-price").textContent =
      formatMoney(Number(product.price));

    // Show modal
    document
      .getElementById("added-to-wishlist-modal")
      .classList.remove("hidden");
    document.getElementById("wishlist-overlay").classList.remove("hidden");

    // Auto-close after 5 seconds
    clearTimeout(window.cartModalTimeout);
    window.cartModalTimeout = setTimeout(closeWishlistModal, 5000);
  });

  function closeWishlistModal() {
    document.getElementById("added-to-wishlist-modal").classList.add("hidden");
    document.getElementById("wishlist-overlay").classList.add("hidden");
  }

  document
    .getElementById("wishlist-overlay")
    .addEventListener("click", closeWishlistModal);
  document
    .getElementById("close-wishlist-modal")
    .addEventListener("click", closeWishlistModal);

  // Initialize
  updateAddToCartState();
});
