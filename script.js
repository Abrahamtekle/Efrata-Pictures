// ===========================================================
// Efrata Pictures — Site Script
// ===========================================================

// ---------- EmailJS Configuration ----------
// Fill in these three values from your EmailJS dashboard (emailjs.com):
// 1. SERVICE_ID   -> Email Services tab
// 2. TEMPLATE_ID  -> Email Templates tab
// 3. PUBLIC_KEY   -> Account > General tab
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

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
    submitBookingBtn.disabled = true;
    submitBookingBtn.textContent = 'Sending...';

    const booking = {
      name: document.getElementById('fname').value.trim(),
      email: document.getElementById('femail').value.trim(),
      phone: document.getElementById('fphone').value.trim(),
      type: document.getElementById('ftype').value,
      date: document.getElementById('fdate').value,
      location: document.getElementById('flocation').value.trim(),
      notes: document.getElementById('fnotes').value.trim(),
      submittedAt: new Date().toISOString()
    };

    try {
      const key = 'booking:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
      const result = await window.storage.set(key, JSON.stringify(booking), true);
      if (!result) throw new Error('Storage returned no result');

      // Send email notification via EmailJS (if configured)
      if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            name: booking.name,
            email: booking.email,
            phone: booking.phone || 'Not provided',
            type: booking.type,
            date: booking.date,
            location: booking.location || 'Not provided',
            notes: booking.notes || 'None'
          });
        } catch (emailErr) {
          console.error('Email notification failed (booking was still saved):', emailErr);
        }
      }

      confirmBanner.classList.add('show');
      confirmBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bookingForm.reset();
      toast('Booking request saved.');
    } catch (err) {
      console.error('Booking save error:', err);
      toast('Something went wrong saving your request — please try again.');
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

  async function loadReviews() {
    reviewsGrid.innerHTML = '<div class="empty-reviews">Loading reviews…</div>';
    try {
      const listResult = await window.storage.list('review:', true);
      const keys = (listResult && listResult.keys) || [];
      if (keys.length === 0) {
        reviewsGrid.innerHTML = '<div class="empty-reviews">No reviews yet — be the first to share your experience.</div>';
        reviewCountStat.textContent = '0';
        avgRatingStat.textContent = '—';
        return;
      }
      const reviews = [];
      for (const k of keys) {
        try {
          const res = await window.storage.get(k, true);
          if (res && res.value) reviews.push(JSON.parse(res.value));
        } catch (err) { console.error('Failed to load review', k, err); }
      }
      reviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      reviewsGrid.innerHTML = reviews.map(r => `
        <div class="review-card">
          <div class="stars">${renderStars(r.rating || 5)}</div>
          <p class="quote">"${escapeHtml(r.quote)}"</p>
          <div class="who"><span>${escapeHtml(r.name)}</span><span>${escapeHtml(r.session || '')}</span></div>
        </div>
      `).join('');

      reviewCountStat.textContent = reviews.length;
      const avg = reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length;
      avgRatingStat.textContent = avg.toFixed(1);
    } catch (err) {
      console.error('Review load error:', err);
      reviewsGrid.innerHTML = '<div class="empty-reviews">Couldn\'t load reviews right now.</div>';
    }
  }

  reviewForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (selectedRating === 0) { toast('Please select a star rating.'); return; }
    submitReviewBtn.disabled = true;
    submitReviewBtn.textContent = 'Submitting...';

    const review = {
      name: document.getElementById('rname').value.trim(),
      session: document.getElementById('rsession').value,
      quote: document.getElementById('rquote').value.trim(),
      rating: selectedRating,
      submittedAt: new Date().toISOString()
    };

    try {
      const key = 'review:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
      const result = await window.storage.set(key, JSON.stringify(review), true);
      if (!result) throw new Error('Storage returned no result');
      modalBackdrop.classList.remove('show');
      reviewForm.reset();
      selectedRating = 0;
      [...starPicker.children].forEach(b => b.classList.remove('active'));
      toast('Thank you for your review!');
      loadReviews();
    } catch (err) {
      console.error('Review save error:', err);
      toast('Something went wrong submitting your review — please try again.');
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = 'Submit Review';
    }
  });

  loadReviews();
})();
