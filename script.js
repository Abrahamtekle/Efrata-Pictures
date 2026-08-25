// ===========================================================
// Efrata Pictures — Site Script
// ===========================================================

// ---------- EmailJS Configuration ----------
// Fill in these from your EmailJS dashboard (emailjs.com):
// 1. SERVICE_ID          -> Email Services tab (one service, used for both forms)
// 2. BOOKING_TEMPLATE_ID -> Email Templates tab (template for booking requests)
// 3. REVIEW_TEMPLATE_ID  -> Email Templates tab (template for new review submissions)
// 4. PUBLIC_KEY          -> Account > General tab
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_BOOKING_TEMPLATE_ID = 'YOUR_BOOKING_TEMPLATE_ID';
const EMAILJS_REVIEW_TEMPLATE_ID = 'YOUR_REVIEW_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_READY = EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

if (window.emailjs && EMAILJS_READY) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// ---------- Approved Reviews ----------
// This site has no live database, so reviews are curated by hand.
// When a visitor submits a review, it's emailed to you (once EmailJS is
// configured above). To publish an approved review on the site, add an
// entry to this array in the same format, then re-upload script.js.
const APPROVED_REVIEWS = [
  // Example — copy this shape for each new approved review:
  // { name: 'Sarah M.', session: 'Wedding', rating: 5, quote: 'Efrata Pictures made our day feel effortless and the photos are stunning.' },
];

(function() {
  // Header scroll state
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Mobile menu
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  function openMobileMenu() {
    mobileMenu.classList.add('show');
    burgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    mobileMenu.classList.remove('show');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burgerBtn.addEventListener('click', openMobileMenu);
  mobileMenuClose.addEventListener('click', closeMobileMenu);
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));

  // Scroll-triggered zoom-in reveal for service and gallery photos
  const revealTargets = document.querySelectorAll('.service-visual, .gallery-grid .g');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: no IntersectionObserver support, just show everything
    revealTargets.forEach(el => el.classList.add('in-view'));
  }

  const toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  // ---------- Booking form ----------
  const bookingForm = document.getElementById('bookingForm');
  const confirmBanner = document.getElementById('confirmBanner');
  const submitBookingBtn = document.getElementById('submitBookingBtn');

  bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!EMAILJS_READY) {
      toast('Booking isn\'t connected yet — please call or email us directly to reserve your date.');
      return;
    }

    submitBookingBtn.disabled = true;
    submitBookingBtn.textContent = 'Sending...';

    const booking = {
      name: document.getElementById('fname').value.trim(),
      email: document.getElementById('femail').value.trim(),
      phone: document.getElementById('fphone').value.trim(),
      type: document.getElementById('ftype').value,
      date: document.getElementById('fdate').value,
      location: document.getElementById('flocation').value.trim(),
      notes: document.getElementById('fnotes').value.trim()
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_BOOKING_TEMPLATE_ID, {
        name: booking.name,
        email: booking.email,
        phone: booking.phone || 'Not provided',
        type: booking.type,
        date: booking.date,
        location: booking.location || 'Not provided',
        notes: booking.notes || 'None'
      });

      confirmBanner.classList.add('show');
      confirmBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bookingForm.reset();
      toast('Booking request sent!');
    } catch (err) {
      console.error('Booking email error:', err);
      toast('Something went wrong sending your request — please try again or contact us directly.');
    } finally {
      submitBookingBtn.disabled = false;
      submitBookingBtn.textContent = 'Request Booking';
    }
  });

  // ---------- Reviews ----------
  const reviewsGrid = document.getElementById('reviewsGrid');
  const reviewCountStat = document.getElementById('reviewCountStat');
  const avgRatingStat = document.getElementById('avgRatingStat');
  const modalBackdrop = document.getElementById('reviewModalBackdrop');
  const openBtn = document.getElementById('openReviewModal');
  const closeBtn = document.getElementById('closeReviewModal');
  const starPicker = document.getElementById('starPicker');
  const reviewForm = document.getElementById('reviewForm');
  const submitReviewBtn = document.getElementById('submitReviewBtn');
  let selectedRating = 0;

  openBtn.addEventListener('click', () => modalBackdrop.classList.add('show'));
  closeBtn.addEventListener('click', () => modalBackdrop.classList.remove('show'));
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) modalBackdrop.classList.remove('show'); });

  starPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    selectedRating = parseInt(btn.dataset.val, 10);
    [...starPicker.children].forEach((b, i) => b.classList.toggle('active', i < selectedRating));
  });

  function renderStars(n) { return '★★★★★☆☆☆☆☆'.slice(5 - n, 10 - n); }
  function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

  function renderReviews() {
    if (APPROVED_REVIEWS.length === 0) {
      reviewsGrid.innerHTML = '<div class="empty-reviews">No reviews yet — be the first to share your experience.</div>';
      reviewCountStat.textContent = '0';
      avgRatingStat.textContent = '—';
      return;
    }

    reviewsGrid.innerHTML = APPROVED_REVIEWS.map(r => `
      <div class="review-card">
        <div class="stars">${renderStars(r.rating || 5)}</div>
        <p class="quote">"${escapeHtml(r.quote)}"</p>
        <div class="who"><span>${escapeHtml(r.name)}</span><span>${escapeHtml(r.session || '')}</span></div>
      </div>
    `).join('');

    reviewCountStat.textContent = APPROVED_REVIEWS.length;
    const avg = APPROVED_REVIEWS.reduce((s, r) => s + (r.rating || 5), 0) / APPROVED_REVIEWS.length;
    avgRatingStat.textContent = avg.toFixed(1);
  }

  reviewForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (selectedRating === 0) { toast('Please select a star rating.'); return; }

    if (!EMAILJS_READY) {
      toast('Reviews aren\'t connected yet — please email your review to us directly.');
      return;
    }

    submitReviewBtn.disabled = true;
    submitReviewBtn.textContent = 'Submitting...';

    const review = {
      name: document.getElementById('rname').value.trim(),
      session: document.getElementById('rsession').value,
      quote: document.getElementById('rquote').value.trim(),
      rating: selectedRating
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_REVIEW_TEMPLATE_ID, {
        name: review.name,
        session: review.session,
        rating: review.rating,
        quote: review.quote
      });

      modalBackdrop.classList.remove('show');
      reviewForm.reset();
      selectedRating = 0;
      [...starPicker.children].forEach(b => b.classList.remove('active'));
      toast('Thank you! Your review has been sent for approval.');
    } catch (err) {
      console.error('Review email error:', err);
      toast('Something went wrong sending your review — please try again.');
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = 'Submit Review';
    }
  });

  renderReviews();
})();
