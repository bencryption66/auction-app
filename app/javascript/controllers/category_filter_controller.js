import { Controller } from "@hotwired/stimulus";

// Connects to data-controller="category-filter"
export default class extends Controller {
  static targets = ["chip"];

  connect() {
    this.selectedCategories = new Set();
  }

  toggle(event) {
    const chip = event.target;
    const categoryId = chip.dataset.categoryId;

    if (chip.checked) {
      this.selectedCategories.add(categoryId);
    } else {
      this.selectedCategories.delete(categoryId);
    }

    this.updateListings();
  }

  updateListings() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    if (this.selectedCategories.size > 0) {
      params.set("categories", Array.from(this.selectedCategories).join(","));
      params.set("page", "1"); // Reset to first page on filter change
    } else {
      params.delete("categories");
    }

    // Turbo.visit(`${url.pathname}?${params.toString()}`);
    window.location.href = `${url.pathname}?${params.toString()}`;
  }
}
