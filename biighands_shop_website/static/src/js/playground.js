/** @odoo-module **/

function initConfigurator(form) {
    const width = form.querySelector("[data-bhp-width]");
    const height = form.querySelector("[data-bhp-height]");
    const widthOutput = form.querySelector("[data-bhp-width-output]");
    const heightOutput = form.querySelector("[data-bhp-height-output]");
    const estimate = form.querySelector("[data-bhp-estimate]");
    const quantity = form.querySelector('input[name="quantity"]');
    const preview = document.querySelector("[data-bhp-preview]");

    function update() {
        const widthValue = Number(width?.value || 0);
        const heightValue = Number(height?.value || 0);
        if (widthOutput) widthOutput.textContent = `${widthValue.toLocaleString()} mm`;
        if (heightOutput) heightOutput.textContent = `${heightValue.toLocaleString()} mm`;
        if (estimate) {
            const base = Number(estimate.dataset.price || 0);
            const finish = form.querySelector('input[name="finish"]:checked')?.value || "";
            const glazing = form.querySelector('input[name="glazing"]:checked')?.value || "";
            const finishMultiplier = {
                "Matte Black": 1.08, "Anodized Bronze": 1.15, Champagne: 1.22,
                "American Walnut": 1.15, "Smoked Oak": 1.10, "Ebonized Ash": 1.20,
                "Graphite Velvet": 1.18, "Wool Bouclé": 1.12, "Silk Blend": 1.25,
            }[finish] || 1;
            const glazingMultiplier = {
                "Triple Glazing": 1.25, "Laminated Acoustic": 1.18,
                "Cotton Lining": 1.10, "Blackout Lining": 1.20, "Thermal Lining": 1.15,
            }[glazing] || 1;
            const measure = estimate.dataset.priceUnit === "metre"
                ? widthValue / 1000
                : widthValue * heightValue / 1000000;
            const total = base
                ? Math.round(base * measure * finishMultiplier * glazingMultiplier * Number(quantity?.value || 1))
                : 0;
            estimate.textContent = total
                ? `${estimate.dataset.currency || ""}${total.toLocaleString()}`
                : "Priced individually";
        }
    }
    width?.addEventListener("input", update);
    height?.addEventListener("input", update);
    quantity?.addEventListener("input", update);
    form.querySelectorAll('input[name="finish"]').forEach((input, index) => {
        input.addEventListener("change", () => {
            if (!preview) return;
            const colors = ["#bab6aa", "#292927", "#705947", "#c2a77c", "#755b3f"];
            preview.style.background = colors[index % colors.length];
            update();
        });
    });
    form.querySelectorAll('input[name="glazing"]').forEach((input) => input.addEventListener("change", update));
    form.querySelector('input[type="file"]')?.addEventListener("change", (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 6 || files.some((file) => !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)) {
            event.target.value = "";
            window.alert("Choose up to 6 image files, no larger than 8 MB each.");
        }
    });
    update();
}

function initConcierge() {
    const root = document.querySelector("[data-bhp-concierge]");
    if (!root) return;
    const toggle = root.querySelector(".bhp-concierge-toggle");
    const panel = root.querySelector(".bhp-concierge-panel");
    const close = root.querySelector("[data-bhp-concierge-close]");
    const form = root.querySelector("[data-bhp-concierge-form]");
    const messages = root.querySelector("[data-bhp-concierge-messages]");
    const setOpen = (open) => {
        root.classList.toggle("is-open", open);
        toggle?.setAttribute("aria-expanded", String(open));
        panel?.setAttribute("aria-hidden", String(!open));
        if (open) form?.querySelector("input")?.focus();
    };
    toggle?.addEventListener("click", () => setOpen(!root.classList.contains("is-open")));
    close?.addEventListener("click", () => setOpen(false));
    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input");
        const text = input?.value.trim();
        if (!text) return;
        const user = document.createElement("p");
        user.className = "is-user";
        user.textContent = text;
        messages.appendChild(user);
        const query = text.toLowerCase();
        const map = [
            [["curtain", "drape", "fabric", "blackout"], "curtains", "Our curtain collection covers sheers, blackout layers and wave-heading drapes."],
            [["carpentry", "wardrobe", "cabinet", "timber", "wood"], "carpentry", "Our carpentry collection includes wardrobe walls, panelling and display cabinetry."],
            [["door", "sliding", "patio"], "doors", "Explore thermally broken combination units and panoramic sliding doors."],
            [["window", "casement", "screen", "lift"], "windows", "Our window systems cover casement, sliding, screened and motorised lift configurations."],
            [["bespoke", "custom", "unique"], "bespoke", "For a one-off piece, open a bespoke product and attach reference images to your request."],
        ];
        const match = map.find(([words]) => words.some((word) => query.includes(word)));
        const reply = document.createElement("p");
        const link = document.createElement("a");
        const collection = match?.[1] || "";
        reply.append(document.createTextNode(`${match?.[2] || "Choose a collection, set dimensions and finishes, then sign in to submit a tailored quotation."} `));
        link.href = collection ? `/catalogue?collection=${collection}` : "/catalogue";
        link.textContent = "View matching systems";
        reply.appendChild(link);
        messages.appendChild(reply);
        input.value = "";
        messages.scrollTop = messages.scrollHeight;
    });
}

function startAtelier() {
    const stalePreloaderLogo = document.querySelector(".bhp-villa-preloader-logo:not(img)");
    if (stalePreloaderLogo) {
        const logo = document.createElement("img");
        logo.className = "bhp-villa-preloader-logo";
        logo.src = "/biighands_shop_website/static/src/img/logo.png";
        logo.alt = "Playground";
        stalePreloaderLogo.replaceWith(logo);
    }
    // Some deployed databases can retain an edited copy of the former homepage
    // view after the module source has changed. Remove those retired bands too,
    // so stale QWeb markup cannot reappear without its old styling.
    document.querySelectorAll(
        ".bhp-home .bhp-manifesto, .bhp-home .bhp-craft, .bhp-home .bhp-process"
    ).forEach((section) => section.remove());
    const home = document.querySelector(".bhp-home");
    const featured = home?.querySelector(".bhp-featured");
    if (featured && !home.querySelector(".bhp-ateliers")) {
        featured.insertAdjacentHTML("beforebegin", `
            <section class="bhp-ateliers bhp-shell">
                <header class="bhp-ateliers-head">
                    <p class="bhp-kicker">Three Ateliers</p>
                    <h2>One house, <em>three crafts.</em></h2>
                </header>
                <div class="bhp-ateliers-grid">
                    <a href="/catalogue?collection=windows" class="bhp-atelier-card">
                        <div><b>01.</b><h3>Aluminium Systems</h3><p>Windows, doors, canopies and profiles — engineered to the millimetre, anodized in-house.</p></div>
                        <span>Explore aluminium <i>→</i></span>
                    </a>
                    <a href="/catalogue?collection=carpentry" class="bhp-atelier-card">
                        <div><b>02.</b><h3>Bespoke Carpentry</h3><p>Wardrobe walls, timber panelling and display cabinetry in walnut, oak, ash and maple.</p></div>
                        <span>Explore carpentry <i>→</i></span>
                    </a>
                    <a href="/catalogue?collection=curtains" class="bhp-atelier-card">
                        <div><b>03.</b><h3>Curtains &amp; Drapery</h3><p>Belgian linen sheers, velvet blackouts and wave-heading drapes, cut to your exact drop.</p></div>
                        <span>Explore drapery <i>→</i></span>
                    </a>
                </div>
            </section>
        `);
    }
    const year = document.querySelector("[data-bhp-year]");
    if (year) year.textContent = String(new Date().getFullYear());
    const siteHeader = document.querySelector(".bhp-site-header");
    const menuToggle = document.querySelector(".bhp-menu-toggle");
    menuToggle?.addEventListener("click", () => {
        const isOpen = siteHeader?.classList.toggle("is-open") || false;
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    const announcement = document.querySelector(".bhs-ann-items");
    if (announcement) {
        announcement.innerHTML = [
            "<div class='bhs-ann-item'><span><b>MADE TO MEASURE</b> to the millimetre</span></div>",
            "<div class='bhs-ann-item'><span>Aluminium, timber <b>&amp; drapery</b></span></div>",
            "<div class='bhs-ann-item'><span>Every request <b>atelier reviewed</b></span></div>",
            "<div class='bhs-ann-item' style='border-right:none'><span><b>Client Portal</b> for quotations</span></div>",
        ].join("");
    }
    const newsletterHeading = document.querySelector(".bhs-ft-news-txt h4");
    const newsletterCopy = document.querySelector(".bhs-ft-news-txt p");
    if (newsletterHeading) newsletterHeading.textContent = "Atelier notes in your inbox";
    if (newsletterCopy) newsletterCopy.textContent = "New systems, material stories and project guidance—only when useful.";
    document.querySelectorAll("[data-bhp-configurator]").forEach(initConfigurator);
    initConcierge();
    initPinnedScenes();
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const href = anchor.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
}

function initPinnedScenes() {
    const scenes = document.querySelectorAll(".bhp-hero, .bhp-scroll-chapter");
    if (!scenes.length) return;
    let scheduled = false;

    function update() {
        scheduled = false;
        const header = document.querySelector(".bhp-site-header");
        const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom || 0);
        scenes.forEach((section) => {
            const stage = section.querySelector(".bhp-hero-stage, .bhp-chapter-stage");
            if (!stage) return;
            const rect = section.getBoundingClientRect();
            const availableHeight = Math.max(420, window.innerHeight - headerBottom);
            const isActive = rect.top <= headerBottom && rect.bottom >= headerBottom + availableHeight;
            const isFinished = rect.bottom < headerBottom + availableHeight;

            // Keep the resting and pinned stages at the exact same viewport
            // height. Otherwise ResizeObserver changes the camera aspect at the
            // pin boundary and the 3D object appears to shrink for one frame.
            stage.style.setProperty("--bhp-pin-height", `${availableHeight}px`);
            stage.classList.toggle("is-bhp-pinned", isActive);
            stage.classList.toggle("is-bhp-finished", !isActive && isFinished);
            if (isActive) {
                stage.style.setProperty("--bhp-pin-top", `${headerBottom}px`);
                stage.style.setProperty("--bhp-pin-left", `${rect.left}px`);
                stage.style.setProperty("--bhp-pin-width", `${rect.width}px`);
            }
        });
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    document.querySelector("#wrapwrap")?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAtelier, { once: true });
} else {
    startAtelier();
}
