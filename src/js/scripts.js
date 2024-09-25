document.addEventListener("DOMContentLoaded", () => {
  createGallery();
  header();
  navigator();
  scrollNav();
});

function navigator() {
  document.addEventListener("scroll", () => {
    const section = document.querySelectorAll("section");
    const anchor = document.querySelectorAll(".header__container--nav a");
    let active = "";

    section.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - sectionHeight / 3) {
        active = section.id;
      }
    });

    anchor.forEach((link) => {
      link.classList.remove("focus");
      if (link.getAttribute("href") === "#" + active) {
        link.classList.add("focus");
      }
    });
  });
}

function scrollNav() {
  const navLink = document.querySelectorAll(".header__container--nav a");

  navLink.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const sectionScroll = e.target.getAttribute("href");
      const section = document.querySelector(sectionScroll);

      section.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function header() {
  const header = document.querySelector(".header");
  const aboutFestival = document.querySelector(".aboutFestival");

  document.addEventListener("scroll", () => {
    if (aboutFestival.getBoundingClientRect().bottom < 1) {
      header.classList.add("fixed");
    } else {
      header.classList.remove("fixed");
    }
  });
}

function createGallery() {
  const gallery = document.querySelector(".gallery__photo");
  const elements = 16;

  for (let i = 1; i <= elements; i++) {
    const img = document.createElement("PICTURE");
    img.innerHTML = `
      <source srcset="./img/gallery/thumb/${i}.avif" type="image/avif"/>
      <source srcset="./img/gallery/thumb/${i}.webp" type="image/webp"/>
      <img loading="lazy" src="./img/gallery/thumb/${i}.jpg" alt="Imagen de DJ's" />
    `;
    gallery.appendChild(img);
    img.onclick = () => showImg(i);
  }
}

function showImg(i) {
  const img = document.createElement("IMG");
  const body = document.querySelector("body");
  const modal = document.createElement("DIV");

  img.src = `./img/gallery/full/${i}.jpg`;
  img.alt = "Gallery IMG";

  body.classList.add("overflow-hidden");
  modal.classList.add("modal");
  modal.onclick = () => closeImg();

  modal.appendChild(img);
  body.appendChild(modal);
}

function closeImg() {
  const body = document.querySelector("body");
  const modal = document.querySelector(".modal");
  modal.classList.add("fade-out");

  setTimeout(() => {
    modal?.remove();
    body.classList.remove("overflow-hidden");
  }, 500);
}
